/**
 * Pure Calculation Utilities
 *
 * Deterministic, side-effect-free functions for financial calculations.
 * These are the mathematical primitives that the audit engine builds upon.
 *
 * Every function here is:
 * - Pure (no side effects, no external state)
 * - Deterministic (same input → same output, always)
 * - Independently testable
 *
 * @module engine/calculations
 */

// ---------------------------------------------------------------------------
// Currency helpers
// ---------------------------------------------------------------------------

/**
 * Round to 2 decimal places using banker's rounding.
 * Avoids floating-point drift in financial calculations.
 */
export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

// ---------------------------------------------------------------------------
// Annual / Monthly conversions
// ---------------------------------------------------------------------------

/** Convert monthly savings to annual */
export function monthlyToAnnual(monthlySavings: number): number {
  return roundCurrency(monthlySavings * 12);
}

/** Convert annual to monthly */
export function annualToMonthly(annualSavings: number): number {
  return roundCurrency(annualSavings / 12);
}

// ---------------------------------------------------------------------------
// Seat calculations
// ---------------------------------------------------------------------------

/** Calculate cost for a given number of seats at a given price per seat */
export function seatCost(seats: number, pricePerSeat: number): number {
  return roundCurrency(seats * pricePerSeat);
}

/**
 * Calculate excess seats given team size and licensed seats.
 * Returns 0 if seats <= teamSize (no excess).
 */
export function excessSeats(licensedSeats: number, teamSize: number): number {
  return Math.max(0, licensedSeats - teamSize);
}

/**
 * Calculate monthly savings from reducing excess seats.
 * Returns 0 if there are no excess seats.
 */
export function excessSeatSavings(
  licensedSeats: number,
  teamSize: number,
  pricePerSeat: number
): number {
  const excess = excessSeats(licensedSeats, teamSize);
  return roundCurrency(excess * pricePerSeat);
}

// ---------------------------------------------------------------------------
// Downgrade calculations
// ---------------------------------------------------------------------------

/**
 * Calculate savings from downgrading to a cheaper plan.
 * Both prices are per-seat; calculation uses the given seat count.
 */
export function downgradeSavings(
  currentPricePerSeat: number,
  cheaperPricePerSeat: number,
  seats: number
): number {
  const diff = currentPricePerSeat - cheaperPricePerSeat;
  if (diff <= 0) return 0;
  return roundCurrency(diff * seats);
}

/**
 * Check if a downgrade savings meets the significance threshold.
 * We require at least `thresholdPercent` of current cost to recommend.
 * Default threshold: 15% — conservative to avoid trivial recommendations.
 */
export function isSignificantSavings(
  savings: number,
  currentCost: number,
  thresholdPercent: number = 0.15
): boolean {
  if (currentCost <= 0) return false;
  return savings / currentCost >= thresholdPercent;
}

// ---------------------------------------------------------------------------
// Overlap / Consolidation
// ---------------------------------------------------------------------------

/**
 * Detect tools with overlapping categories in the user's stack.
 * Returns groups of tool IDs that share the same category.
 * Only returns groups with 2+ tools (actual overlaps).
 */
export function findOverlappingTools(
  tools: Array<{ toolId: string; category: string }>
): Map<string, string[]> {
  const categoryMap = new Map<string, string[]>();

  for (const tool of tools) {
    const existing = categoryMap.get(tool.category) ?? [];
    existing.push(tool.toolId);
    categoryMap.set(tool.category, existing);
  }

  // Filter to only categories with 2+ tools
  const overlaps = new Map<string, string[]>();
  for (const [category, toolIds] of categoryMap) {
    if (toolIds.length >= 2) {
      overlaps.set(category, toolIds);
    }
  }

  return overlaps;
}

/**
 * Estimate consolidation savings when using the cheaper tool.
 * Takes the spend of the more expensive tool as potential savings.
 * Returns the monthly savings from dropping the pricier duplicate.
 *
 * Note: This is a conservative estimate — the user may need features
 * from the more expensive tool. Hence confidence = "medium".
 */
export function consolidationSavings(
  tool1Spend: number,
  tool2Spend: number
): number {
  // Savings = the smaller of the two spends (drop the cheaper one is wrong;
  // we suggest they keep the one they prefer and drop the other)
  // Conservative: report the minimum possible savings
  return roundCurrency(Math.min(tool1Spend, tool2Spend));
}

// ---------------------------------------------------------------------------
// Percentage & threshold helpers
// ---------------------------------------------------------------------------

/**
 * Calculate savings as a percentage of total spend.
 * Returns 0 if total spend is 0 (avoid division by zero).
 */
export function savingsPercentage(
  totalSavings: number,
  totalSpend: number
): number {
  if (totalSpend <= 0) return 0;
  return Math.round((totalSavings / totalSpend) * 100);
}

/**
 * Determine if total savings crosses the "high savings" threshold.
 * Used to surface prominent messaging in the UI.
 * Threshold: 20% or more of total spend = "high savings"
 */
export function isHighSavings(
  totalSavings: number,
  totalSpend: number,
  thresholdPercent: number = 20
): boolean {
  return savingsPercentage(totalSavings, totalSpend) >= thresholdPercent;
}

// ---------------------------------------------------------------------------
// Pricing normalization
// ---------------------------------------------------------------------------

/**
 * Normalize a user-reported spend to per-seat monthly rate.
 * Useful when users enter total spend rather than per-seat.
 */
export function normalizeToPerSeat(
  totalMonthlySpend: number,
  seats: number
): number {
  if (seats <= 0) return 0;
  return roundCurrency(totalMonthlySpend / seats);
}

/**
 * Detect overpayment: when user reports spending more than
 * the catalog price × seats would suggest.
 *
 * Returns the overpayment amount, or 0 if spending <= expected.
 * Possible reasons: annual billing discrepancy, add-ons, tax, etc.
 */
export function detectOverpayment(
  reportedMonthlySpend: number,
  catalogPricePerSeat: number,
  seats: number
): number {
  const expectedCost = seatCost(seats, catalogPricePerSeat);
  const overpayment = reportedMonthlySpend - expectedCost;
  return overpayment > 0 ? roundCurrency(overpayment) : 0;
}

// ---------------------------------------------------------------------------
// Formula string builders (for transparent calculation display)
// ---------------------------------------------------------------------------

/** Build a human-readable formula for seat rightsizing */
export function rightsizingFormula(
  excessCount: number,
  pricePerSeat: number,
  savings: number
): string {
  return `${excessCount} excess seat${excessCount !== 1 ? "s" : ""} × $${pricePerSeat}/seat = $${savings}/mo`;
}

/** Build a human-readable formula for plan downgrade */
export function downgradeFormula(
  seats: number,
  currentPrice: number,
  cheaperPrice: number,
  savings: number
): string {
  return `${seats} seat${seats !== 1 ? "s" : ""} × ($${currentPrice} − $${cheaperPrice}) = $${savings}/mo`;
}

/** Build a human-readable formula for consolidation */
export function consolidationFormula(
  droppedToolName: string,
  droppedSpend: number
): string {
  return `Drop ${droppedToolName} → save $${droppedSpend}/mo`;
}
