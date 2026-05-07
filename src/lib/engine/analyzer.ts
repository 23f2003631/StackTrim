/**
 * Audit Analysis Engine
 *
 * This is the core financial logic of StackTrim.
 * Every calculation here is deterministic and explainable.
 * AI never touches these numbers.
 *
 * The engine takes user input + catalog data and produces
 * actionable, conservative savings recommendations.
 *
 * Analysis pipeline:
 * 1. Per-tool analysis (rightsizing, downgrades, credits)
 * 2. Cross-tool analysis (duplicate detection, consolidation)
 * 3. "Keep" recommendations for optimized tools
 * 4. Aggregation and sorting
 *
 * @module engine/analyzer
 * @version 2.0 — Day 2: consolidation, confidence scoring, calculation breakdowns
 */

import type {
  AuditInput,
  AuditResult,
  Recommendation,
  ToolEntry,
  CalculationBreakdown,
} from "@/lib/types/audit";
import type { ToolCatalogEntry } from "@/lib/types/catalog";
import { getToolById } from "@/lib/engine/catalog";
import { pricingCatalog } from "@/lib/engine/catalog";
import {
  excessSeats,
  excessSeatSavings,
  downgradeSavings,
  isSignificantSavings,
  monthlyToAnnual,
  savingsPercentage as calcSavingsPercentage,
  consolidationSavings,
  rightsizingFormula,
  downgradeFormula,
  consolidationFormula,
  findOverlappingTools,
  roundCurrency,
} from "@/lib/engine/calculations";
import {
  scoreConfidence,
  rightsizingConfidence,
  downgradeConfidence,
  consolidationConfidence,
  creditConfidence,
  isPricingFresh,
} from "@/lib/engine/confidence";

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

function generateAuditId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `audit_${timestamp}_${random}`;
}

// ---------------------------------------------------------------------------
// Individual tool analysis
// ---------------------------------------------------------------------------

/**
 * Analyze a single tool entry against catalog data.
 * Returns zero or more recommendations.
 *
 * Analysis checks:
 * 1. Seat rightsizing — are they paying for more seats than team size?
 * 2. Plan downgrade — can they use a cheaper tier?
 * 3. Credit eligibility — does the vendor offer startup credits?
 */
export function analyzeToolSpend(
  entry: ToolEntry,
  teamSize: number,
  catalogEntry: ToolCatalogEntry
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const pricingFresh = isPricingFresh(catalogEntry.lastVerified);

  // --- Seat rightsizing ---
  if (entry.seats > teamSize) {
    const excess = excessSeats(entry.seats, teamSize);
    const currentPlan = catalogEntry.plans.find((p) => p.id === entry.planTier);
    if (currentPlan && currentPlan.monthlyPricePerSeat > 0) {
      const monthlySavings = excessSeatSavings(
        entry.seats,
        teamSize,
        currentPlan.monthlyPricePerSeat
      );
      if (monthlySavings > 0) {
        const confidence = scoreConfidence(rightsizingConfidence(pricingFresh));
        const calculation: CalculationBreakdown = {
          currentPlanName: currentPlan.name,
          recommendedPlanName: currentPlan.name,
          currentPricePerSeat: currentPlan.monthlyPricePerSeat,
          recommendedPricePerSeat: currentPlan.monthlyPricePerSeat,
          seatCount: excess,
          formula: rightsizingFormula(excess, currentPlan.monthlyPricePerSeat, monthlySavings),
        };
        recommendations.push({
          type: "rightsize",
          toolId: entry.toolId,
          toolName: catalogEntry.name,
          currentSpend: entry.monthlySpend,
          recommendedSpend: roundCurrency(entry.monthlySpend - monthlySavings),
          monthlySavings,
          annualSavings: monthlyToAnnual(monthlySavings),
          reasoning: `You have ${entry.seats} seats but a team of ${teamSize}. Removing ${excess} excess seat${excess > 1 ? "s" : ""} at $${currentPlan.monthlyPricePerSeat}/seat saves $${monthlySavings}/mo.`,
          confidence: confidence.level,
          calculation,
        });
      }
    }
  }

  // --- Plan downgrade opportunity ---
  const currentPlanIndex = catalogEntry.plans.findIndex(
    (p) => p.id === entry.planTier
  );
  if (currentPlanIndex > 0) {
    // There's a cheaper plan available
    const cheaperPlan = catalogEntry.plans[currentPlanIndex - 1];
    const currentPlan = catalogEntry.plans[currentPlanIndex];

    const potentialSavings = downgradeSavings(
      currentPlan.monthlyPricePerSeat,
      cheaperPlan.monthlyPricePerSeat,
      entry.seats
    );

    const currentCost = roundCurrency(currentPlan.monthlyPricePerSeat * entry.seats);

    if (potentialSavings > 0 && isSignificantSavings(potentialSavings, currentCost)) {
      const confidence = scoreConfidence(
        downgradeConfidence(pricingFresh, true)
      );
      const calculation: CalculationBreakdown = {
        currentPlanName: currentPlan.name,
        recommendedPlanName: cheaperPlan.name,
        currentPricePerSeat: currentPlan.monthlyPricePerSeat,
        recommendedPricePerSeat: cheaperPlan.monthlyPricePerSeat,
        seatCount: entry.seats,
        formula: downgradeFormula(
          entry.seats,
          currentPlan.monthlyPricePerSeat,
          cheaperPlan.monthlyPricePerSeat,
          potentialSavings
        ),
      };
      recommendations.push({
        type: "downgrade",
        toolId: entry.toolId,
        toolName: catalogEntry.name,
        currentSpend: entry.monthlySpend,
        recommendedSpend: roundCurrency(entry.monthlySpend - potentialSavings),
        monthlySavings: potentialSavings,
        annualSavings: monthlyToAnnual(potentialSavings),
        reasoning: `Consider "${cheaperPlan.name}" plan ($${cheaperPlan.monthlyPricePerSeat}/seat) instead of "${currentPlan.name}" ($${currentPlan.monthlyPricePerSeat}/seat). Saves $${potentialSavings}/mo across ${entry.seats} seat${entry.seats > 1 ? "s" : ""}.`,
        confidence: confidence.level,
        calculation,
      });
    }
  }

  // --- Startup credit eligibility ---
  if (catalogEntry.hasStartupCredits && catalogEntry.creditNotes) {
    const confidence = scoreConfidence(creditConfidence());
    recommendations.push({
      type: "credit",
      toolId: entry.toolId,
      toolName: catalogEntry.name,
      currentSpend: entry.monthlySpend,
      recommendedSpend: entry.monthlySpend,
      monthlySavings: 0,
      annualSavings: 0,
      reasoning: catalogEntry.creditNotes,
      confidence: confidence.level,
    });
  }

  return recommendations;
}

// ---------------------------------------------------------------------------
// Cross-tool analysis: duplicate/overlap detection
// ---------------------------------------------------------------------------

/**
 * Detect overlapping tools across the user's stack.
 * If a user has multiple tools in the same category (e.g., two AI assistants),
 * suggest consolidation.
 *
 * Returns consolidation recommendations for each overlap group.
 */
export function analyzeToolOverlaps(
  entries: ToolEntry[],
  resolveToolEntry: (toolId: string) => ToolCatalogEntry | undefined
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Build category map from catalog data
  const toolsWithCategories = entries
    .map((entry) => {
      const catalog = resolveToolEntry(entry.toolId);
      return catalog ? { toolId: entry.toolId, category: catalog.category, entry, catalog } : null;
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);

  const overlaps = findOverlappingTools(toolsWithCategories);

  for (const [, toolIds] of overlaps) {
    if (toolIds.length < 2) continue;

    // Find the tools in this overlap group
    const overlappingTools = toolsWithCategories.filter((t) =>
      toolIds.includes(t.toolId)
    );

    // Sort by spend descending — keep the most expensive (assumed most used)
    overlappingTools.sort((a, b) => b.entry.monthlySpend - a.entry.monthlySpend);

    // Suggest dropping each tool except the most expensive one
    const keepTool = overlappingTools[0];
    for (let i = 1; i < overlappingTools.length; i++) {
      const dropTool = overlappingTools[i];
      const savings = consolidationSavings(
        keepTool.entry.monthlySpend,
        dropTool.entry.monthlySpend
      );

      if (savings <= 0) continue;

      const confidence = scoreConfidence(
        consolidationConfidence(isPricingFresh(dropTool.catalog.lastVerified))
      );

      recommendations.push({
        type: "consolidate",
        toolId: dropTool.toolId,
        toolName: dropTool.catalog.name,
        currentSpend: dropTool.entry.monthlySpend,
        recommendedSpend: 0,
        monthlySavings: savings,
        annualSavings: monthlyToAnnual(savings),
        reasoning: `You have both ${keepTool.catalog.name} and ${dropTool.catalog.name} in the same category. Consider consolidating to ${keepTool.catalog.name} to save $${savings}/mo.`,
        confidence: confidence.level,
        calculation: {
          currentPlanName: dropTool.catalog.name,
          recommendedPlanName: keepTool.catalog.name,
          currentPricePerSeat: 0,
          recommendedPricePerSeat: 0,
          seatCount: dropTool.entry.seats,
          formula: consolidationFormula(dropTool.catalog.name, savings),
        },
      });
    }
  }

  return recommendations;
}

// ---------------------------------------------------------------------------
// "Keep" recommendations for already-optimized tools
// ---------------------------------------------------------------------------

/**
 * Generate "keep" recommendations for tools that are already optimized.
 * This builds trust by showing the user we evaluated every tool honestly,
 * not just the ones where we found savings.
 */
function generateKeepRecommendations(
  entries: ToolEntry[],
  existingRecToolIds: Set<string>
): Recommendation[] {
  const keeps: Recommendation[] = [];

  for (const entry of entries) {
    if (existingRecToolIds.has(entry.toolId)) continue;

    const catalogEntry = getToolById(entry.toolId);
    if (!catalogEntry) continue;

    const currentPlanIndex = catalogEntry.plans.findIndex(
      (p) => p.id === entry.planTier
    );

    // Only generate "keep" for tools on the lowest paid plan or free plan
    const isLowestTier = currentPlanIndex <= 0;
    const hasExcessSeats = entry.seats > 0; // Can't rightsize further

    if (isLowestTier || !hasExcessSeats) {
      keeps.push({
        type: "keep",
        toolId: entry.toolId,
        toolName: catalogEntry.name,
        currentSpend: entry.monthlySpend,
        recommendedSpend: entry.monthlySpend,
        monthlySavings: 0,
        annualSavings: 0,
        reasoning: isLowestTier
          ? `Already on the lowest available plan ("${catalogEntry.plans[currentPlanIndex]?.name ?? "Free"}"). No downgrade available.`
          : `Current plan appears well-sized for your team. No changes recommended.`,
        confidence: "high",
      });
    }
  }

  return keeps;
}

// ---------------------------------------------------------------------------
// Full audit generation
// ---------------------------------------------------------------------------

/**
 * Generate a complete audit result from user input.
 * This is the main entry point for the analysis engine.
 *
 * The function:
 * 1. Iterates through each tool in the user's stack
 * 2. Looks up catalog data for deterministic pricing
 * 3. Runs per-tool analysis (rightsizing, downgrades, credits)
 * 4. Runs cross-tool analysis (duplicate detection, consolidation)
 * 5. Generates "keep" recs for already-optimized tools
 * 6. Aggregates results into a comprehensive audit
 */
export function generateAuditResult(input: AuditInput): AuditResult {
  const allRecommendations: Recommendation[] = [];

  // --- Phase 1: Per-tool analysis ---
  for (const toolEntry of input.tools) {
    const catalogEntry = getToolById(toolEntry.toolId);
    if (!catalogEntry) continue;

    const toolRecs = analyzeToolSpend(toolEntry, input.teamSize, catalogEntry);
    allRecommendations.push(...toolRecs);
  }

  // --- Phase 2: Cross-tool overlap/consolidation analysis ---
  const overlapRecs = analyzeToolOverlaps(input.tools, getToolById);
  allRecommendations.push(...overlapRecs);

  // --- Phase 3: "Keep" recommendations for optimized tools ---
  const recsWithSavings = new Set(
    allRecommendations
      .filter((r) => r.monthlySavings > 0)
      .map((r) => r.toolId)
  );
  const keepRecs = generateKeepRecommendations(input.tools, recsWithSavings);
  allRecommendations.push(...keepRecs);

  // --- Phase 4: Sort and assign priorities ---
  // Sort by monthly savings descending (most impactful first)
  // Credit and keep recs go to the bottom
  allRecommendations.sort((a, b) => {
    // Savings recommendations first
    if (a.monthlySavings !== b.monthlySavings) {
      return b.monthlySavings - a.monthlySavings;
    }
    // Then by type weight
    const typeWeight = { rightsize: 0, downgrade: 1, consolidate: 2, credit: 3, keep: 4 } as Record<string, number>;
    return (typeWeight[a.type] ?? 5) - (typeWeight[b.type] ?? 5);
  });

  // Assign priority ranks
  allRecommendations.forEach((rec, index) => {
    rec.priority = index + 1;
  });

  // --- Phase 5: Aggregate totals ---
  const totalMonthlySpend = input.tools.reduce(
    (sum, t) => sum + t.monthlySpend,
    0
  );
  const totalMonthlySavings = allRecommendations.reduce(
    (sum, r) => sum + r.monthlySavings,
    0
  );
  const totalAnnualSavings = monthlyToAnnual(totalMonthlySavings);

  // Detect overlaps
  const toolCategories = input.tools
    .map((t) => {
      const catalog = getToolById(t.toolId);
      return catalog ? { toolId: t.toolId, category: catalog.category } : null;
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);
  const overlaps = findOverlappingTools(toolCategories);

  const optimizedToolCount = keepRecs.length;

  return {
    id: generateAuditId(),
    input,
    recommendations: allRecommendations,
    totalMonthlySpend: roundCurrency(totalMonthlySpend),
    totalMonthlySavings: roundCurrency(totalMonthlySavings),
    totalAnnualSavings,
    savingsPercentage: calcSavingsPercentage(totalMonthlySavings, totalMonthlySpend),
    createdAt: new Date().toISOString(),
    catalogVersion: pricingCatalog.version,
    hasOverlappingTools: overlaps.size > 0,
    optimizedToolCount,
  };
}
