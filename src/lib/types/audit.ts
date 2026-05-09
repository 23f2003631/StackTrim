/**
 * Core domain types for the StackTrim audit engine.
 *
 * These types define the entire data flow from user input
 * through analysis to recommendation output. All financial
 * calculations are deterministic — no AI touches these numbers.
 *
 * @module types/audit
 * @version 2.0 — Day 2 expansion
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
  /** Optional email for follow-up (never included in public snapshots) */
  email?: string;
  /** Total team size (used for seat utilization analysis) */
  teamSize: number;
  /** All AI tools in the user's stack */
  tools: ToolEntry[];
  /** Optional internal notes (never included in public snapshots) */
  notes?: string;
}

// ---------------------------------------------------------------------------
// Recommendation Types
// ---------------------------------------------------------------------------

/** Categories of savings recommendations */
export type RecommendationType =
  | "downgrade"       // User is on a higher tier than needed
  | "consolidate"     // Multiple tools serve the same purpose
  | "credit"          // Eligible for startup/volume credits
  | "eliminate"        // Tool is unused or redundant
  | "rightsize"        // Too many seats for team size
  | "keep"             // Current plan is already optimal
  | "switch-vendor"    // A cheaper alternative vendor exists
  | "review-api-usage"; // API spend may be optimizable

/** Confidence level of a recommendation */
export type ConfidenceLevel = "high" | "medium" | "low";

/** Transparent breakdown of how savings were calculated */
export interface CalculationBreakdown {
  /** What we're comparing from */
  currentPlanName: string;
  /** What we're comparing to */
  recommendedPlanName: string;
  /** Price per seat on current plan */
  currentPricePerSeat: number;
  /** Price per seat on recommended plan */
  recommendedPricePerSeat: number;
  /** Number of seats in calculation */
  seatCount: number;
  /** Human-readable formula (e.g., "5 seats × ($40 − $20) = $100/mo") */
  formula: string;
}

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
  /** Transparent calculation breakdown (omitted for non-financial recs like credits) */
  calculation?: CalculationBreakdown;
  /** Priority rank within the audit (1 = highest impact) */
  priority?: number;
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
  /** Catalog version used for this audit */
  catalogVersion: string;
  /** Whether any tool in the stack had duplicate-category overlap */
  hasOverlappingTools: boolean;
  /** Number of tools that already look optimally priced */
  optimizedToolCount: number;
}

// ---------------------------------------------------------------------------
// Public Audit Snapshot
// ---------------------------------------------------------------------------

/**
 * A sanitized, shareable version of an audit result.
 * Strips all PII (email, company name, notes) for public share URLs.
 *
 * This type ensures we never accidentally leak sensitive data
 * when rendering a /share/:id page.
 */
export interface PublicAuditSnapshot {
  /** Same audit ID as the full result */
  id: string;
  /** Sanitized input — no email, no company name, no notes */
  teamSize: number;
  toolCount: number;
  /** Tool names only (no IDs, no spend per tool) */
  toolNames: string[];
  /** Aggregate recommendations — no per-tool spend details */
  recommendations: PublicRecommendation[];
  /** Summary financials */
  totalMonthlySpend: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  savingsPercentage: number;
  /** Metadata */
  createdAt: string;
  catalogVersion: string;
  engineVersion: string;
  metadata: {
    hasHighSavings: boolean;
    hasOverlappingTools: boolean;
    optimizedToolCount: number;
    aiSummary?: string;
  };
}

/** Sanitized recommendation for public display */
export interface PublicRecommendation {
  type: RecommendationType;
  toolName: string;
  reasoning: string;
  confidence: ConfidenceLevel;
  monthlySavings: number;
  annualSavings: number;
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
  totalAnnualSavings: number;
  savingsPercentage: number;
  status: AuditStatus;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Confidence Metadata
// ---------------------------------------------------------------------------

/** Explains why a particular confidence level was assigned */
export interface ConfidenceReason {
  level: ConfidenceLevel;
  /** Factors that increased confidence */
  supportingFactors: string[];
  /** Factors that decreased confidence */
  uncertaintyFactors: string[];
}
