import { getToolById } from "@/lib/engine/catalog";
import type { ToolCatalogEntry } from "@/lib/types/catalog";
import type { PricingMismatchSeverity } from "@/lib/types/audit";

/**
 * Retrieves the expected price per seat for a given tool and plan tier.
 */
export function getPlanPrice(toolId: string, planTierId: string): number {
  const tool = getToolById(toolId);
  if (!tool) return 0;
  
  const plan = tool.plans.find((p) => p.id === planTierId);
  return plan?.monthlyPricePerSeat || 0;
}

/**
 * Computes the expected monthly spend based on catalog pricing.
 */
export function computeExpectedSpend(planPrice: number, seats: number): number {
  return planPrice * seats;
}

/**
 * Computes the absolute percentage deviation between actual and expected spend.
 * Returns a value where 0 = no deviation, 0.5 = 50% deviation.
 */
export function computeDeviation(actual: number, expected: number): number {
  if (expected === 0) return 0; // Avoid division by zero
  return Math.abs(actual - expected) / expected;
}

/**
 * Classifies the mismatch severity based on the deviation percentage.
 * LOW: 10-20%
 * MEDIUM: 20-50%
 * HIGH: 50-150%
 * EXTREME: > 150%
 */
export function classifyMismatchSeverity(deviation: number): PricingMismatchSeverity {
  if (deviation < 0.1) return "none";
  if (deviation <= 0.2) return "low";
  if (deviation <= 0.5) return "medium";
  if (deviation <= 1.5) return "high";
  return "extreme";
}

/**
 * Determines if a custom enterprise or negotiated contract is likely
 * based on the severity of the pricing mismatch.
 */
export function isCustomContractLikely(severity: PricingMismatchSeverity): boolean {
  return severity === "high" || severity === "extreme";
}

/**
 * Applies a bounded optimization to savings potential when extreme mismatches occur.
 * If the user's entered spend is vastly higher than the catalog price, we cannot
 * realistically claim they will save the entire delta just by using the catalog price.
 * 
 * Example: Copilot (expected $39), User enters $1000.
 * If they downgrade to $20/mo, we don't say they save $980.
 * We blend the savings or cap them to maintain realism and operational trust.
 */
export function capSavingsPotential(
  actualSpend: number,
  expectedSpend: number,
  optimizedExpectedSpend: number,
  severity: PricingMismatchSeverity
): number {
  // The catalog-based theoretical savings
  const catalogTheoreticalSavings = expectedSpend - optimizedExpectedSpend;
  
  // If there's no mismatch or low mismatch, assume the theoretical savings scaled by their actual spend.
  // We use the proportion of actual vs expected to scale the savings up/down slightly.
  if (severity === "none" || severity === "low") {
    if (expectedSpend === 0) return 0;
    const savingsRatio = catalogTheoreticalSavings / expectedSpend;
    return actualSpend * savingsRatio;
  }
  
  if (severity === "medium") {
    // For medium mismatches, blend 50/50 between pure catalog math and proportional math
    if (expectedSpend === 0) return 0;
    const savingsRatio = catalogTheoreticalSavings / expectedSpend;
    const proportionalSavings = actualSpend * savingsRatio;
    return (catalogTheoreticalSavings + proportionalSavings) / 2;
  }
  
  // For HIGH and EXTREME mismatches, the user is likely on a vastly different enterprise
  // contract or we are comparing apples (seat-based) to oranges (usage-based).
  // We cap the potential savings aggressively to avoid absurd claims.
  // Blended spend: heavily lean toward the actual spend as the true baseline,
  // but cap savings to no more than 2x the catalog's theoretical savings.
  const maxSavingsCap = catalogTheoreticalSavings * 2;
  
  if (expectedSpend === 0) return 0;
  const savingsRatio = catalogTheoreticalSavings / expectedSpend;
  const proportionalSavings = actualSpend * savingsRatio;
  
  return Math.min(proportionalSavings, maxSavingsCap);
}
