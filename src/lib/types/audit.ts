/**
 * Core domain types for the StackTrim audit engine.
 *
 * These types define the entire data flow from user input
 * through analysis to recommendation output. All financial
 * calculations are deterministic — no AI touches these numbers.
 */

// ---------------------------------------------------------------------------
// User Input Types
// ---------------------------------------------------------------------------

/** A single AI tool entry from the user's stack */
export interface ToolEntry {
  /** Reference to a tool in the pricing catalog */
  toolId: string;
  /** Current plan tier (e.g., "pro", "team", "enterprise") */
  planTier: string;
  /** Current monthly spend in USD */
  monthlySpend: number;
  /** Number of active seats/licenses */
  seats: number;
  /** How the tool is being used */
  useCases: string[];
}

/** Complete audit input from the spend form */
export interface AuditInput {
  /** Optional company name for personalization */
  companyName?: string;
  /** Total team size (used for seat utilization analysis) */
  teamSize: number;
  /** All AI tools in the user's stack */
  tools: ToolEntry[];
}

// ---------------------------------------------------------------------------
// Recommendation Types
// ---------------------------------------------------------------------------

/** Categories of savings recommendations */
export type RecommendationType =
  | "downgrade"     // User is on a higher tier than needed
  | "consolidate"   // Multiple tools serve the same purpose
  | "credit"        // Eligible for startup/volume credits
  | "eliminate"     // Tool is unused or redundant
  | "rightsize";    // Too many seats for team size

/** Confidence level of a recommendation */
export type ConfidenceLevel = "high" | "medium" | "low";

/** A single actionable recommendation */
export interface Recommendation {
  /** Type of savings opportunity */
  type: RecommendationType;
  /** Which tool this applies to */
  toolId: string;
  /** Human-readable tool name */
  toolName: string;
  /** Current monthly spend */
  currentSpend: number;
  /** Recommended monthly spend after optimization */
  recommendedSpend: number;
  /** Monthly savings = currentSpend - recommendedSpend */
  monthlySavings: number;
  /** Annual savings = monthlySavings * 12 */
  annualSavings: number;
  /** Plain-English explanation of why this was flagged */
  reasoning: string;
  /** How confident we are in this recommendation */
  confidence: ConfidenceLevel;
}

// ---------------------------------------------------------------------------
// Audit Result Types
// ---------------------------------------------------------------------------

/** Complete audit result — the full output of the analysis engine */
export interface AuditResult {
  /** Unique identifier for this audit */
  id: string;
  /** The original input that produced this result */
  input: AuditInput;
  /** All recommendations, sorted by savings (highest first) */
  recommendations: Recommendation[];
  /** Sum of all tool monthly spends */
  totalMonthlySpend: number;
  /** Sum of all recommendation monthly savings */
  totalMonthlySavings: number;
  /** totalMonthlySavings * 12 */
  totalAnnualSavings: number;
  /** Savings as a percentage of total spend */
  savingsPercentage: number;
  /** ISO 8601 timestamp of when audit was generated */
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Audit Status (for future async processing)
// ---------------------------------------------------------------------------

export type AuditStatus = "pending" | "processing" | "complete" | "error";

/** Lightweight audit reference for lists/history */
export interface AuditSummary {
  id: string;
  companyName?: string;
  toolCount: number;
  totalMonthlySavings: number;
  status: AuditStatus;
  createdAt: string;
}
