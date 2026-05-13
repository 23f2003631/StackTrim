import { getToolById } from "@/lib/engine/catalog";
import type { PricingMismatchSeverity } from "@/lib/types/audit";

export function getPlanPrice(toolId: string, planTierId: string): number {
  const tool = getToolById(toolId);
  if (!tool) return 0;

  const plan = tool.plans.find((p) => p.id === planTierId);
  return plan?.monthlyPricePerSeat || 0;
}

export function computeExpectedSpend(planPrice: number, seats: number): number {
  return planPrice * seats;
}

export function computeDeviation(actual: number, expected: number): number {
  if (expected === 0) return 0;
  return Math.abs(actual - expected) / expected;
}

export function classifyMismatchSeverity(deviation: number): PricingMismatchSeverity {
  if (deviation < 0.1) return "none";
  if (deviation <= 0.2) return "low";
  if (deviation <= 0.5) return "medium";
  if (deviation <= 1.5) return "high";
  return "extreme";
}

export function isCustomContractLikely(severity: PricingMismatchSeverity): boolean {
  return severity === "high" || severity === "extreme";
}

export function capSavingsPotential(
  actualSpend: number,
  expectedSpend: number,
  optimizedExpectedSpend: number,
  severity: PricingMismatchSeverity
): number {
  const catalogTheoreticalSavings = expectedSpend - optimizedExpectedSpend;

  if (severity === "none" || severity === "low") {
    if (expectedSpend === 0) return 0;
    const savingsRatio = catalogTheoreticalSavings / expectedSpend;
    return actualSpend * savingsRatio;
  }

  if (severity === "medium") {
    if (expectedSpend === 0) return 0;
    const savingsRatio = catalogTheoreticalSavings / expectedSpend;
    const proportionalSavings = actualSpend * savingsRatio;
    return (catalogTheoreticalSavings + proportionalSavings) / 2;
  }

  const maxSavingsCap = catalogTheoreticalSavings * 2;

  if (expectedSpend === 0) return 0;
  const savingsRatio = catalogTheoreticalSavings / expectedSpend;
  const proportionalSavings = actualSpend * savingsRatio;

  return Math.min(proportionalSavings, maxSavingsCap);
}
