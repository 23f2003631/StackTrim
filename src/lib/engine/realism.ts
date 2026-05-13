import type { SavingsRealismLevel } from "@/lib/types/audit";

export function classifySavingsRealism(percentage: number): SavingsRealismLevel {
  if (percentage <= 15) return "normal";
  if (percentage <= 35) return "aggressive";
  return "extreme";
}

export function getRealismContext(level: SavingsRealismLevel): string {
  switch (level) {
    case "extreme":
      return "Large optimization potential detected. Results may depend on actual organizational usage patterns and existing enterprise commitments.";
    case "aggressive":
      return "Strong savings opportunities identified. Operational workflows should be evaluated before executing major migrations.";
    case "normal":
    default:
      return "Conservative optimization based on current market benchmarks and team size.";
  }
}

export function calculateOptimizableSeats(
  currentSeats: number,
  teamSize: number,
  isExtreme: boolean = false
): number {
  const excess = Math.max(0, currentSeats - teamSize);
  if (excess === 0) return currentSeats;

  const reductionRatio = isExtreme ? 0.4 : 0.7;
  const realisticReduction = Math.floor(excess * reductionRatio);

  return currentSeats - realisticReduction;
}

export function isFreeTierRealistic(teamSize: number, toolId: string): boolean {
  const enterpriseSensitive = ["vercel", "github", "linear", "slack"];

  if (teamSize > 5 && enterpriseSensitive.includes(toolId)) {
    return false;
  }

  return teamSize <= 10;
}
