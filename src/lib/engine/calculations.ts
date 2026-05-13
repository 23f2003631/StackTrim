export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function monthlyToAnnual(monthlySavings: number): number {
  return roundCurrency(monthlySavings * 12);
}

export function annualToMonthly(annualSavings: number): number {
  return roundCurrency(annualSavings / 12);
}

export function seatCost(seats: number, pricePerSeat: number): number {
  return roundCurrency(seats * pricePerSeat);
}

export function excessSeats(licensedSeats: number, teamSize: number): number {
  return Math.max(0, licensedSeats - teamSize);
}

export function excessSeatSavings(
  licensedSeats: number,
  teamSize: number,
  pricePerSeat: number
): number {
  const excess = excessSeats(licensedSeats, teamSize);
  return roundCurrency(excess * pricePerSeat);
}

export function downgradeSavings(
  currentPricePerSeat: number,
  cheaperPricePerSeat: number,
  seats: number
): number {
  const diff = currentPricePerSeat - cheaperPricePerSeat;
  if (diff <= 0) return 0;
  return roundCurrency(diff * seats);
}

export function isSignificantSavings(
  savings: number,
  currentCost: number,
  thresholdPercent: number = 0.15
): boolean {
  if (currentCost <= 0) return false;
  return savings / currentCost >= thresholdPercent;
}

export function findOverlappingTools(
  tools: Array<{ toolId: string; category: string }>
): Map<string, string[]> {
  const categoryMap = new Map<string, string[]>();

  for (const tool of tools) {
    const existing = categoryMap.get(tool.category) ?? [];
    existing.push(tool.toolId);
    categoryMap.set(tool.category, existing);
  }

  const overlaps = new Map<string, string[]>();
  for (const [category, toolIds] of categoryMap) {
    if (toolIds.length >= 2) {
      overlaps.set(category, toolIds);
    }
  }

  return overlaps;
}

export function consolidationSavings(
  tool1Spend: number,
  tool2Spend: number
): number {
  return roundCurrency(Math.min(tool1Spend, tool2Spend));
}

export function savingsPercentage(
  totalSavings: number,
  totalSpend: number
): number {
  if (totalSpend <= 0) return 0;
  return Math.round((totalSavings / totalSpend) * 100);
}

export function isHighSavings(
  totalSavings: number,
  totalSpend: number,
  thresholdPercent: number = 20
): boolean {
  return savingsPercentage(totalSavings, totalSpend) >= thresholdPercent;
}

export function normalizeToPerSeat(
  totalMonthlySpend: number,
  seats: number
): number {
  if (seats <= 0) return 0;
  return roundCurrency(totalMonthlySpend / seats);
}

export function detectOverpayment(
  reportedMonthlySpend: number,
  catalogPricePerSeat: number,
  seats: number
): number {
  const expectedCost = seatCost(seats, catalogPricePerSeat);
  const overpayment = reportedMonthlySpend - expectedCost;
  return overpayment > 0 ? roundCurrency(overpayment) : 0;
}

export function rightsizingFormula(
  excessCount: number,
  pricePerSeat: number,
  savings: number
): string {
  return `${excessCount} excess seat${excessCount !== 1 ? "s" : ""} × $${pricePerSeat}/seat = $${savings}/mo`;
}

export function downgradeFormula(
  seats: number,
  currentPrice: number,
  cheaperPrice: number,
  savings: number
): string {
  return `${seats} seat${seats !== 1 ? "s" : ""} × ($${currentPrice} − $${cheaperPrice}) = $${savings}/mo`;
}

export function consolidationFormula(
  droppedToolName: string,
  droppedSpend: number
): string {
  return `Drop ${droppedToolName} → save $${droppedSpend}/mo`;
}
