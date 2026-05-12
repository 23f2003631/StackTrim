import type { SavingsRealismLevel } from "@/lib/types/audit";

/**
 * Classifies the identified savings into realism tiers.
 * 0-15%: Normal
 * 15-35%: Strong (Aggressive)
 * 35%+: Extreme (Suspicious)
 */
export function classifySavingsRealism(percentage: number): SavingsRealismLevel {
  if (percentage <= 15) return "normal";
  if (percentage <= 35) return "aggressive";
  return "extreme";
}

/**
 * Returns contextual warnings based on the realism level.
 */
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

/**
 * Calculates a realistic number of seats that can be optimized.
 * Real companies rarely optimize 100% of seats immediately due to 
 * organizational inertia, department-specific needs, and legacy workflows.
 * 
 * conservative: 30-50% of excess seats
 * balanced: 50-80% of excess seats
 */
export function calculateOptimizableSeats(
  currentSeats: number,
  teamSize: number,
  isExtreme: boolean = false
): number {
  const excess = Math.max(0, currentSeats - teamSize);
  if (excess === 0) return currentSeats;

  // Realism: Only assume we can cut 60% of excess seats in a conservative model
  // to account for "ghost seats", shared accounts, or specialized users.
  const reductionRatio = isExtreme ? 0.4 : 0.7; 
  const realisticReduction = Math.floor(excess * reductionRatio);
  
  return currentSeats - realisticReduction;
}

/**
 * Determines if a "Downgrade to Free" is realistic.
 * For teams > 5, "Free" is almost never realistic for core tools 
 * due to SSO, security, and admin requirements.
 */
export function isFreeTierRealistic(teamSize: number, toolId: string): boolean {
  // Common enterprise-critical tools
  const enterpriseSensitive = ["vercel", "github", "linear", "slack"];
  
  if (teamSize > 5 && enterpriseSensitive.includes(toolId)) {
    return false;
  }
  
  return teamSize <= 10;
}
