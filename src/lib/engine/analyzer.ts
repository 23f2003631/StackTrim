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
  degradeConfidenceForMismatch,
} from "@/lib/engine/confidence";
import {
  computeExpectedSpend,
  computeDeviation,
  classifyMismatchSeverity,
  isCustomContractLikely,
  capSavingsPotential,
} from "@/lib/engine/pricing";
import {
  runOptimizationPipeline,
  clampSavings,
} from "@/lib/engine/pipeline";
import {
  classifySavingsRealism,
  calculateOptimizableSeats,
  isFreeTierRealistic,
} from "@/lib/engine/realism";

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

  // --- Setup pricing consistency ---
  const currentPlan = catalogEntry.plans.find((p) => p.id === entry.planTier);
  const planPrice = currentPlan ? currentPlan.monthlyPricePerSeat : 0;
  
  const expectedSpend = computeExpectedSpend(planPrice, entry.seats);
  const actualSpend = entry.monthlySpend;
  const deviation = computeDeviation(actualSpend, expectedSpend);
  const severity = classifyMismatchSeverity(deviation);
  const customContract = isCustomContractLikely(severity);
  
  const consistency: Recommendation["pricingConsistency"] = {
    expectedSpend,
    actualSpend,
    deviationPercentage: deviation * 100,
    severity,
    customContractLikely: customContract,
  };

  // --- Seat rightsizing ---
  if (entry.seats > teamSize && currentPlan && planPrice > 0) {
    const excess = excessSeats(entry.seats, teamSize);
    
    // Theoretical savings if they right-sized the *catalog* amount
    const catalogMonthlySavings = excessSeatSavings(
      entry.seats,
      teamSize,
      planPrice
    );
    
    // Bounded savings based on their *actual* entered spend vs extreme mismatch
    const expectedOptimizedSpend = computeExpectedSpend(planPrice, teamSize);
    const monthlySavings = capSavingsPotential(actualSpend, expectedSpend, expectedOptimizedSpend, severity);
    
    if (monthlySavings > 0) {
      const baseConfidence = scoreConfidence(rightsizingConfidence(pricingFresh)).level;
      const confidence = degradeConfidenceForMismatch(baseConfidence, severity);
        const calculation: CalculationBreakdown = {
          currentPlanName: currentPlan.name,
          recommendedPlanName: currentPlan.name,
          currentPricePerSeat: planPrice,
          recommendedPricePerSeat: planPrice,
          seatCount: excess,
          recommendedPlanId: currentPlan.id,
          formula: rightsizingFormula(excess, planPrice, monthlySavings),
        };
        
        const realisticSeats = calculateOptimizableSeats(entry.seats, teamSize, severity === "extreme");
        const seatsToRemove = entry.seats - realisticSeats;
        const realisticSavings = roundCurrency(seatsToRemove * planPrice);
        
        const signals = [
          `Detected ${entry.seats} seats for team of ${teamSize}`,
          `High seat-to-spend ratio (${entry.seats} units)`,
        ];
        if (severity !== "none") signals.push(`Pricing mismatch detected (${severity})`);

        const narrative = seatsToRemove < excess
          ? `Some seats may not require active licenses. Conservative right-sizing could reduce your allocation by ${seatsToRemove} seat${seatsToRemove > 1 ? "s" : ""}, saving ~$${realisticSavings}/mo while maintaining operational buffer.`
          : `You have ${entry.seats} seats but a team of ${teamSize}. Removing ${excess} excess seat${excess > 1 ? "s" : ""} at $${planPrice}/seat saves ~ $${roundCurrency(monthlySavings)}/mo.`;

        recommendations.push({
          type: "rightsize",
          toolId: entry.toolId,
          toolName: catalogEntry.name,
          currentSpend: actualSpend,
          recommendedSpend: roundCurrency(actualSpend - realisticSavings),
          monthlySavings: realisticSavings,
          annualSavings: monthlyToAnnual(realisticSavings),
          recommendedSeats: realisticSeats,
          reasoning: narrative,
          reasoningDetails: {
            narrative,
            detectedSignals: signals,
            usageAssumptions: ["Assumes 20-40% organizational overhead for seat allocation"],
            confidenceFactors: [
              pricingFresh ? "Fresh catalog pricing" : "Stale catalog pricing",
              severity === "none" ? "Consistent with public pricing" : "Custom pricing mismatch reduces certainty",
            ],
          },
          assumptions: {
            assumesPartialSeatReduction: seatsToRemove < excess,
            assumesMigrationFeasible: true,
          },
          confidence,
          calculation,
          pricingConsistency: consistency,
        });
      }
    }


  // --- Plan downgrade opportunity ---
  const currentPlanIndex = catalogEntry.plans.findIndex(
    (p) => p.id === entry.planTier
  );
  if (currentPlanIndex > 0) {
    // There's a cheaper plan available
    const cheaperPlan = catalogEntry.plans[currentPlanIndex - 1];
    if (currentPlan) {
      // Check if downgrade to Free is realistic for this team
      const isFreeTier = cheaperPlan.monthlyPricePerSeat === 0;
      const isRealistic = !isFreeTier || isFreeTierRealistic(teamSize, entry.toolId);
      
      const catalogPotentialSavings = downgradeSavings(
        currentPlan.monthlyPricePerSeat,
        cheaperPlan.monthlyPricePerSeat,
        entry.seats
      );

      const expectedOptimizedSpend = computeExpectedSpend(cheaperPlan.monthlyPricePerSeat, entry.seats);
      const potentialSavings = capSavingsPotential(actualSpend, expectedSpend, expectedOptimizedSpend, severity);
      const currentCost = roundCurrency(planPrice * entry.seats);

      if (potentialSavings > 0 && isSignificantSavings(catalogPotentialSavings, currentCost)) {
        const baseConfidence = scoreConfidence(
          downgradeConfidence(pricingFresh, isRealistic)
        ).level;
        
        // Stricter confidence for unrealistic downgrades
        const confidence = isRealistic 
          ? degradeConfidenceForMismatch(baseConfidence, severity)
          : "low";

        const calculation: CalculationBreakdown = {
          currentPlanName: currentPlan.name,
          recommendedPlanName: cheaperPlan.name,
          currentPricePerSeat: currentPlan.monthlyPricePerSeat,
          recommendedPricePerSeat: cheaperPlan.monthlyPricePerSeat,
          seatCount: entry.seats,
          recommendedPlanId: cheaperPlan.id,
          formula: downgradeFormula(
            entry.seats,
            planPrice,
            cheaperPlan.monthlyPricePerSeat,
            potentialSavings
          ),
        };
        
        const narrative = isFreeTier 
          ? `Some seats may not require premium functionality. Evaluating usage patterns may support a partial move to the free tier for non-admin users.`
          : `Usage patterns may support the "${cheaperPlan.name}" tier ($${cheaperPlan.monthlyPricePerSeat}/seat) over your current "${currentPlan.name}" plan. Significant features should be audited before migration.`;

        const signals = [
          `Enterprise-tier features may be underutilized for a team of ${teamSize}`,
          `Public pricing suggests lower-cost alternatives for similar seat counts`,
        ];

        recommendations.push({
          type: "downgrade",
          toolId: entry.toolId,
          toolName: catalogEntry.name,
          currentSpend: actualSpend,
          recommendedSpend: roundCurrency(actualSpend - potentialSavings),
          monthlySavings: roundCurrency(potentialSavings),
          annualSavings: monthlyToAnnual(roundCurrency(potentialSavings)),
          recommendedSeats: entry.seats, // Downgrade keeps seats same unless rightsized later
          reasoning: narrative,
          reasoningDetails: {
            narrative,
            detectedSignals: signals,
            pricingAnalysis: [
              `Plan Price: $${cheaperPlan.monthlyPricePerSeat}/seat`,
              `Current Price: $${planPrice}/seat`,
            ],
            usageAssumptions: [
              isFreeTier ? "Assumes basic usage patterns for subset of team" : "Assumes feature parity for current workflow",
              "Assumes minimal organizational resistance to plan changes",
            ],
            confidenceFactors: [
              isRealistic ? "Standard organizational migration" : "High friction: Downgrade to Free tier requires audit",
              severity === "none" ? "Aligned with public catalog" : "Custom pricing reduces prediction certainty",
            ],
          },
          assumptions: {
            assumesFeatureRedundancy: true,
            assumesLowEnterpriseDependency: teamSize < 20,
            assumesMigrationFeasible: isRealistic,
          },
          confidence,
          calculation,
          pricingConsistency: consistency,
        });
      }
    }
  }

  // --- Startup credit eligibility ---
  if (catalogEntry.hasStartupCredits && catalogEntry.creditNotes) {
    const confidence = scoreConfidence(creditConfidence());
    recommendations.push({
      type: "credit",
      toolId: entry.toolId,
      toolName: catalogEntry.name,
      currentSpend: actualSpend,
      recommendedSpend: actualSpend,
      monthlySavings: 0,
      annualSavings: 0,
      recommendedSeats: entry.seats,
      reasoning: catalogEntry.creditNotes,
      reasoningDetails: {
        narrative: catalogEntry.creditNotes,
        detectedSignals: ["Vendor offers official startup credit program"],
        usageAssumptions: ["Assumes company meets vendor's startup eligibility criteria"],
        confidenceFactors: ["Publicly advertised vendor program"],
      },
      confidence: confidence.level,
      pricingConsistency: consistency,
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
        recommendedSeats: 0,
        reasoning: `Operational redundancy detected between ${keepTool.catalog.name} and ${dropTool.catalog.name}. Consolidation potential identified.`,
        reasoningDetails: {
          narrative: `You have multiple tools (${keepTool.catalog.name} and ${dropTool.catalog.name}) serving the ${keepTool.category} category. Consolidation into a single platform can reduce license sprawl and simplify your stack.`,
          detectedSignals: [
            `Overlapping functionality in ${keepTool.category}`,
            `Duplicate subscription for ${dropTool.catalog.name}`,
          ],
          usageAssumptions: [
            "Assumes feature parity between platforms",
            "Assumes data migration between tools is feasible",
          ],
          confidenceFactors: [
            "Deterministic category overlap",
            "Functional redundancy identified",
          ],
        },
        assumptions: {
          assumesFeatureRedundancy: true,
          assumesMigrationFeasible: false, // Set to false to lower confidence until audited
        },
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
  const auditId = generateAuditId();
  
  // --- Phase 1-3: Run Sequential Optimization Pipeline ---
  const { 
    recommendations: savingsRecs, 
    toolStates, 
    optimizationOrder 
  } = runOptimizationPipeline(input);

  // --- Phase 4: Generate non-savings recommendations (Credits & Keeps) ---
  const allRecommendations: Recommendation[] = [...savingsRecs];
  
  const recsWithSavings = new Set(savingsRecs.map(r => r.toolId));
  const keepRecs = generateKeepRecommendations(input.tools, recsWithSavings);
  allRecommendations.push(...keepRecs);

  // Add credits
  for (const toolEntry of input.tools) {
    const catalogEntry = getToolById(toolEntry.toolId);
    if (catalogEntry?.hasStartupCredits && catalogEntry.creditNotes) {
      const state = toolStates[toolEntry.toolId];
      allRecommendations.push({
        type: "credit",
        toolId: toolEntry.toolId,
        toolName: catalogEntry.name,
        currentSpend: state.currentSpend,
        recommendedSpend: state.currentSpend,
        monthlySavings: 0,
        annualSavings: 0,
        reasoning: catalogEntry.creditNotes,
        confidence: "medium",
        pricingConsistency: {
          expectedSpend: state.currentSpend,
          actualSpend: state.currentSpend,
          deviationPercentage: 0,
          severity: "none",
          customContractLikely: false,
        }
      });
    }
  }

  // --- Phase 5: Sort and assign priorities ---
  allRecommendations.sort((a, b) => {
    if (a.monthlySavings !== b.monthlySavings) {
      return b.monthlySavings - a.monthlySavings;
    }
    const typeWeight = { consolidate: 0, downgrade: 1, rightsize: 2, credit: 3, keep: 4 } as Record<string, number>;
    return (typeWeight[a.type] ?? 5) - (typeWeight[b.type] ?? 5);
  });

  allRecommendations.forEach((rec, index) => {
    rec.priority = index + 1;
    rec.catalogVersion = pricingCatalog.version;
  });

  // --- Phase 6: Aggregate totals with safeguards ---
  const totalMonthlySpend = input.tools.reduce((sum, t) => sum + t.monthlySpend, 0);
  
  // REAL savings are the difference between original total and final optimized total
  const finalOptimizedSpend = Object.values(toolStates).reduce((sum, s) => sum + s.currentSpend, 0);
  let totalMonthlySavings = totalMonthlySpend - finalOptimizedSpend;
  
  // Safeguard: Never allow > 100% savings or negative spend
  totalMonthlySavings = clampSavings(totalMonthlySavings, totalMonthlySpend);
  
  const totalAnnualSavings = monthlyToAnnual(totalMonthlySavings);
  const usedManualOverride = input.tools.some((t) => t.isManualOverride);
  
  const savingsPercentage = calcSavingsPercentage(totalMonthlySavings, totalMonthlySpend);
  const savingsRealismLevel = classifySavingsRealism(savingsPercentage);

  // Determine highest mismatch severity
  const severityLevels = { none: 0, low: 1, medium: 2, high: 3, extreme: 4 };
  let maxMismatchSeverity: import("@/lib/types/audit").PricingMismatchSeverity = "none";
  for (const rec of allRecommendations) {
    if (rec.pricingConsistency?.severity) {
      const currentLevel = severityLevels[rec.pricingConsistency.severity];
      const maxLevel = severityLevels[maxMismatchSeverity];
      if (currentLevel > maxLevel) {
        maxMismatchSeverity = rec.pricingConsistency.severity;
      }
    }
  }

  // Aggregate assumptions
  const aggregateAssumptions: import("@/lib/types/audit").OptimizationAssumptions = {
    assumesPartialSeatReduction: allRecommendations.some(r => r.assumptions?.assumesPartialSeatReduction),
    assumesFeatureRedundancy: allRecommendations.some(r => r.assumptions?.assumesFeatureRedundancy),
    assumesLowEnterpriseDependency: allRecommendations.some(r => r.assumptions?.assumesLowEnterpriseDependency),
    assumesMigrationFeasible: allRecommendations.every(r => r.assumptions?.assumesMigrationFeasible !== false),
  };

  return {
    id: auditId,
    input,
    recommendations: allRecommendations,
    totalMonthlySpend: roundCurrency(totalMonthlySpend),
    totalMonthlySavings: roundCurrency(totalMonthlySavings),
    totalAnnualSavings,
    savingsPercentage,
    createdAt: new Date().toISOString(),
    catalogVersion: pricingCatalog.version,
    hasOverlappingTools: allRecommendations.some(r => r.type === "consolidate"),
    optimizedToolCount: keepRecs.length,
    usedManualOverride,
    maxMismatchSeverity,
    optimizationOrder,
    toolStates,
    savingsRealismLevel,
    aggregateAssumptions,
  };
}
