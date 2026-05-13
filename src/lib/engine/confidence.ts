import type { ConfidenceLevel, ConfidenceReason, RecommendationType } from "@/lib/types/audit";

export interface ConfidenceFactors {
  pricingVerifiedRecently: boolean;
  sameVendorComparison: boolean;
  seatBasedPricing: boolean;
  usageAssumptionRequired: boolean;
  publicPricing: boolean;
  requiresFeatureEvaluation: boolean;
  significantSavings: boolean;
}

export function scoreConfidence(factors: ConfidenceFactors): ConfidenceReason {
  let score = 0;
  const supporting: string[] = [];
  const uncertainty: string[] = [];

  if (factors.pricingVerifiedRecently) {
    score += 2;
    supporting.push("Pricing data verified within last 90 days");
  } else {
    score -= 1;
    uncertainty.push("Pricing data may be stale");
  }

  if (factors.sameVendorComparison) {
    score += 2;
    supporting.push("Same-vendor plan comparison (apples-to-apples)");
  }

  if (factors.seatBasedPricing) {
    score += 1;
    supporting.push("Straightforward per-seat pricing calculation");
  }

  if (factors.publicPricing) {
    score += 1;
    supporting.push("Public pricing page available for verification");
  }

  if (factors.significantSavings) {
    score += 1;
    supporting.push("Savings exceeds significance threshold");
  }

  if (factors.usageAssumptionRequired) {
    score -= 2;
    uncertainty.push("Assumes usage patterns without detailed data");
  }

  if (factors.requiresFeatureEvaluation) {
    score -= 1;
    uncertainty.push("User must evaluate feature tradeoffs");
  }

  let level: ConfidenceLevel;
  if (score >= 6) {
    level = "high";
  } else if (score >= 2) {
    level = "medium";
  } else {
    level = "low";
  }

  return {
    level,
    supportingFactors: supporting,
    uncertaintyFactors: uncertainty,
  };
}

export function defaultConfidenceForType(type: RecommendationType): ConfidenceLevel {
  switch (type) {
    case "rightsize":
      return "high";
    case "downgrade":
    case "consolidate":
    case "switch-vendor":
      return "medium";
    case "eliminate":
    case "credit":
    case "review-api-usage":
      return "low";
    case "keep":
      return "high";
    default:
      return "low";
  }
}

export function rightsizingConfidence(
  pricingVerified: boolean
): ConfidenceFactors {
  return {
    pricingVerifiedRecently: pricingVerified,
    sameVendorComparison: true,
    seatBasedPricing: true,
    usageAssumptionRequired: false,
    publicPricing: true,
    requiresFeatureEvaluation: false,
    significantSavings: true,
  };
}

export function downgradeConfidence(
  pricingVerified: boolean,
  isSignificant: boolean
): ConfidenceFactors {
  return {
    pricingVerifiedRecently: pricingVerified,
    sameVendorComparison: true,
    seatBasedPricing: true,
    usageAssumptionRequired: false,
    publicPricing: true,
    requiresFeatureEvaluation: true,
    significantSavings: isSignificant,
  };
}

export function consolidationConfidence(
  pricingVerified: boolean
): ConfidenceFactors {
  return {
    pricingVerifiedRecently: pricingVerified,
    sameVendorComparison: false,
    seatBasedPricing: true,
    usageAssumptionRequired: true,
    publicPricing: true,
    requiresFeatureEvaluation: true,
    significantSavings: true,
  };
}

export function creditConfidence(): ConfidenceFactors {
  return {
    pricingVerifiedRecently: false,
    sameVendorComparison: false,
    seatBasedPricing: false,
    usageAssumptionRequired: true,
    publicPricing: false,
    requiresFeatureEvaluation: false,
    significantSavings: false,
  };
}

export function isPricingFresh(
  lastVerifiedDate: string,
  stalenessThresholdDays: number = 90
): boolean {
  const verified = new Date(lastVerifiedDate);
  const now = new Date();
  const diffMs = now.getTime() - verified.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= stalenessThresholdDays;
}

export function degradeConfidenceForMismatch(
  currentLevel: ConfidenceLevel,
  severity: import("@/lib/types/audit").PricingMismatchSeverity
): ConfidenceLevel {
  if (severity === "none" || severity === "low") {
    return currentLevel;
  }

  if (severity === "medium") {
    if (currentLevel === "high") return "medium";
    return currentLevel;
  }

  if (severity === "high") {
    if (currentLevel === "high") return "medium";
    if (currentLevel === "medium") return "low";
    return "low";
  }

  if (severity === "extreme") {
    return "low";
  }

  return currentLevel;
}
