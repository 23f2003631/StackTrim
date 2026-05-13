export interface ToolEntry {
  toolId: string;
  planTier: string;
  monthlySpend: number;
  seats: number;
  useCases: string[];
  isManualOverride?: boolean;
}

export interface AuditInput {
  companyName?: string;
  email?: string;
  teamSize: number;
  tools: ToolEntry[];
  notes?: string;
}

export type RecommendationType =
  | "downgrade"
  | "consolidate"
  | "credit"
  | "eliminate"
  | "rightsize"
  | "keep"
  | "switch-vendor"
  | "review-api-usage";

export type OptimizationModifier = "plan" | "seats" | "tool" | "pricing";

export type ConfidenceLevel = "high" | "medium" | "low";

export type PricingMismatchSeverity = "none" | "low" | "medium" | "high" | "extreme";

export type SavingsRealismLevel = "normal" | "aggressive" | "extreme";

export interface OptimizationAssumptions {
  assumesPartialSeatReduction?: boolean;
  assumesFeatureRedundancy?: boolean;
  assumesLowEnterpriseDependency?: boolean;
  assumesMigrationFeasible?: boolean;
}

export interface RecommendationReasoning {
  narrative: string;
  detectedSignals: string[];
  overlapAnalysis?: string[];
  pricingAnalysis?: string[];
  usageAssumptions?: string[];
  confidenceFactors?: string[];
}

export interface PricingConsistency {
  expectedSpend: number;
  actualSpend: number;
  deviationPercentage: number;
  severity: PricingMismatchSeverity;
  customContractLikely: boolean;
}

export interface CalculationBreakdown {
  currentPlanName: string;
  recommendedPlanName: string;
  recommendedPlanId?: string;
  currentPricePerSeat: number;
  recommendedPricePerSeat: number;
  seatCount: number;
  formula: string;
}

export interface Recommendation {
  type: RecommendationType;
  toolId: string;
  toolName: string;
  currentSpend: number;
  recommendedSpend: number;
  monthlySavings: number;
  annualSavings: number;
  recommendedSeats?: number;
  reasoning: string;
  reasoningDetails?: RecommendationReasoning;
  assumptions?: OptimizationAssumptions;
  confidence: ConfidenceLevel;
  calculation?: CalculationBreakdown;
  priority?: number;
  pricingConsistency?: PricingConsistency;
  modifies?: OptimizationModifier;
  preOptimizationSpend?: number;
  postOptimizationSpend?: number;
  contextualNote?: string;
  catalogVersion?: string;
}

export interface OptimizedToolState {
  toolId: string;
  toolName: string;
  originalPlan: string;
  originalSeats: number;
  originalSpend: number;
  currentPlan: string;
  currentSeats: number;
  currentSpend: number;
  appliedRecommendationIds: string[];
}

export interface AuditResult {
  id: string;
  input: AuditInput;
  recommendations: Recommendation[];
  totalMonthlySpend: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  savingsPercentage: number;
  createdAt: string;
  catalogVersion: string;
  hasOverlappingTools: boolean;
  optimizedToolCount: number;
  usedManualOverride: boolean;
  maxMismatchSeverity: PricingMismatchSeverity;
  optimizationOrder: string[];
  toolStates: Record<string, OptimizedToolState>;
  savingsRealismLevel: SavingsRealismLevel;
  aggregateAssumptions: OptimizationAssumptions;
}

export interface PublicAuditSnapshot {
  id: string;
  teamSize: number;
  toolCount: number;
  toolNames: string[];
  recommendations: PublicRecommendation[];
  totalMonthlySpend: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  savingsPercentage: number;
  createdAt: string;
  catalogVersion: string;
  engineVersion: string;
  metadata: {
    hasHighSavings: boolean;
    hasOverlappingTools: boolean;
    optimizedToolCount: number;
    aiSummary?: string;
    usedManualOverride: boolean;
    maxMismatchSeverity: PricingMismatchSeverity;
    savingsRealismLevel: SavingsRealismLevel;
  };
}

export interface PublicRecommendation {
  type: RecommendationType;
  toolName: string;
  reasoning: string;
  confidence: ConfidenceLevel;
  monthlySavings: number;
  annualSavings: number;
  customContractLikely?: boolean;
  contextualNote?: string;
  modifies?: OptimizationModifier;
  reasoningDetails?: RecommendationReasoning;
  catalogVersion?: string;
}

export type AuditStatus = "pending" | "processing" | "complete" | "error";

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

export interface ConfidenceReason {
  level: ConfidenceLevel;
  supportingFactors: string[];
  uncertaintyFactors: string[];
}
