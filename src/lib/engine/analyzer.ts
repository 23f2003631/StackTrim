/**
 * Audit Analysis Engine
 *
 * This is the core financial logic of StackTrim.
 * Every calculation here is deterministic and explainable.
 * AI never touches these numbers.
 *
 * The engine takes user input + catalog data and produces
 * actionable, conservative savings recommendations.
 */

import type {
  AuditInput,
  AuditResult,
  Recommendation,
  ToolEntry,
} from "@/lib/types/audit";
import type { ToolCatalogEntry } from "@/lib/types/catalog";
import { getToolById } from "@/lib/engine/catalog";

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

  // --- Seat rightsizing ---
  if (entry.seats > teamSize) {
    const excessSeats = entry.seats - teamSize;
    const currentPlan = catalogEntry.plans.find((p) => p.id === entry.planTier);
    if (currentPlan && currentPlan.monthlyPricePerSeat > 0) {
      const monthlySavings = excessSeats * currentPlan.monthlyPricePerSeat;
      if (monthlySavings > 0) {
        recommendations.push({
          type: "rightsize",
          toolId: entry.toolId,
          toolName: catalogEntry.name,
          currentSpend: entry.monthlySpend,
          recommendedSpend: entry.monthlySpend - monthlySavings,
          monthlySavings,
          annualSavings: monthlySavings * 12,
          reasoning: `You have ${entry.seats} seats but a team of ${teamSize}. Removing ${excessSeats} excess seat${excessSeats > 1 ? "s" : ""} at $${currentPlan.monthlyPricePerSeat}/seat saves $${monthlySavings}/mo.`,
          confidence: "high",
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

    // Only recommend downgrade if the cheaper plan is meaningfully less expensive
    const currentCost = currentPlan.monthlyPricePerSeat * entry.seats;
    const cheaperCost = cheaperPlan.monthlyPricePerSeat * entry.seats;
    const potentialSavings = currentCost - cheaperCost;

    if (potentialSavings > 0 && potentialSavings >= currentCost * 0.15) {
      recommendations.push({
        type: "downgrade",
        toolId: entry.toolId,
        toolName: catalogEntry.name,
        currentSpend: entry.monthlySpend,
        recommendedSpend: entry.monthlySpend - potentialSavings,
        monthlySavings: potentialSavings,
        annualSavings: potentialSavings * 12,
        reasoning: `Consider "${cheaperPlan.name}" plan ($${cheaperPlan.monthlyPricePerSeat}/seat) instead of "${currentPlan.name}" ($${currentPlan.monthlyPricePerSeat}/seat). Saves $${potentialSavings}/mo across ${entry.seats} seat${entry.seats > 1 ? "s" : ""}.`,
        confidence: "medium",
      });
    }
  }

  // --- Startup credit eligibility ---
  if (catalogEntry.hasStartupCredits && catalogEntry.creditNotes) {
    recommendations.push({
      type: "credit",
      toolId: entry.toolId,
      toolName: catalogEntry.name,
      currentSpend: entry.monthlySpend,
      recommendedSpend: entry.monthlySpend,
      monthlySavings: 0,
      annualSavings: 0,
      reasoning: catalogEntry.creditNotes,
      confidence: "low",
    });
  }

  return recommendations;
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
 * 3. Runs analysis checks (rightsizing, downgrades, credits)
 * 4. Aggregates results into a comprehensive audit
 */
export function generateAuditResult(input: AuditInput): AuditResult {
  const allRecommendations: Recommendation[] = [];

  for (const toolEntry of input.tools) {
    const catalogEntry = getToolById(toolEntry.toolId);
    if (!catalogEntry) continue;

    const toolRecs = analyzeToolSpend(toolEntry, input.teamSize, catalogEntry);
    allRecommendations.push(...toolRecs);
  }

  // Sort by monthly savings descending (most impactful first)
  allRecommendations.sort((a, b) => b.monthlySavings - a.monthlySavings);

  const totalMonthlySpend = input.tools.reduce(
    (sum, t) => sum + t.monthlySpend,
    0
  );
  const totalMonthlySavings = allRecommendations.reduce(
    (sum, r) => sum + r.monthlySavings,
    0
  );

  return {
    id: generateAuditId(),
    input,
    recommendations: allRecommendations,
    totalMonthlySpend,
    totalMonthlySavings,
    totalAnnualSavings: totalMonthlySavings * 12,
    savingsPercentage:
      totalMonthlySpend > 0
        ? Math.round((totalMonthlySavings / totalMonthlySpend) * 100)
        : 0,
    createdAt: new Date().toISOString(),
  };
}
