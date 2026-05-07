/**
 * Confidence Scoring System
 *
 * Assigns structured confidence levels to recommendations based on
 * objective factors: pricing certainty, plan certainty, usage assumptions.
 *
 * This module is critical for trust. Users need to know WHY we're
 * confident (or not) in a recommendation.
 *
 * Confidence Levels:
 * - HIGH:   Exact same-vendor pricing comparison, verified data, no assumptions
 * - MEDIUM: Reasonable assumptions involved (e.g., tool overlap, usage patterns)
 * - LOW:    Significant uncertainty (e.g., API usage guesses, unverified pricing)
 *
 * @module engine/confidence
 */

import type { ConfidenceLevel, ConfidenceReason, RecommendationType } from "@/lib/types/audit";

// ---------------------------------------------------------------------------
// Confidence scoring factors
// ---------------------------------------------------------------------------

export interface ConfidenceFactors {
  /** Is the pricing data recently verified (< 90 days)? */
  pricingVerifiedRecently: boolean;
  /** Are we comparing same-vendor plans (e.g., Cursor Pro → Cursor Free)? */
  sameVendorComparison: boolean;
  /** Is this a straightforward seat-based calculation? */
  seatBasedPricing: boolean;
  /** Are we making assumptions about usage patterns? */
  usageAssumptionRequired: boolean;
  /** Is the pricing publicly listed (not "contact sales")? */
  publicPricing: boolean;
  /** Does the recommendation require the user to evaluate feature tradeoffs? */
  requiresFeatureEvaluation: boolean;
  /** Is the savings amount significant relative to spend? */
  significantSavings: boolean;
}

// ---------------------------------------------------------------------------
// Scoring logic
// ---------------------------------------------------------------------------

/**
 * Determine confidence level based on objective factors.
 * Returns both the level and the reasoning behind it.
 *
 * Scoring rules:
 * - Start with a score of 0
 * - Add points for certainty factors
 * - Subtract points for uncertainty factors
 * - Map final score to HIGH/MEDIUM/LOW
 */
export function scoreConfidence(factors: ConfidenceFactors): ConfidenceReason {
  let score = 0;
  const supporting: string[] = [];
  const uncertainty: string[] = [];

  // Positive factors
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

  // Negative factors
  if (factors.usageAssumptionRequired) {
    score -= 2;
    uncertainty.push("Assumes usage patterns without detailed data");
  }

  if (factors.requiresFeatureEvaluation) {
    score -= 1;
    uncertainty.push("User must evaluate feature tradeoffs");
  }

  // Map score to level
  let level: ConfidenceLevel;
  if (score >= 4) {
    level = "high";
  } else if (score >= 1) {
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

// ---------------------------------------------------------------------------
// Quick confidence helpers per recommendation type
// ---------------------------------------------------------------------------

/**
 * Get default confidence for a recommendation type.
 * These are conservative defaults — the engine can override based on context.
 */
export function defaultConfidenceForType(type: RecommendationType): ConfidenceLevel {
  switch (type) {
    case "rightsize":
      // Seat math is exact if team size is accurate
      return "high";
    case "downgrade":
      // Same-vendor downgrade is fairly certain
      return "medium";
    case "consolidate":
      // Overlap detection requires usage assumptions
      return "medium";
    case "switch-vendor":
      // Cross-vendor comparison has more uncertainty
      return "medium";
    case "eliminate":
      // Can't be sure the tool is truly unused
      return "low";
    case "credit":
      // Credit eligibility is uncertain
      return "low";
    case "review-api-usage":
      // API optimization is highly context-dependent
      return "low";
    case "keep":
      // If we say keep, we're confident it's optimal
      return "high";
    default:
      return "low";
  }
}

/**
 * Build confidence factors for a rightsizing recommendation.
 */
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

/**
 * Build confidence factors for a downgrade recommendation.
 */
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
    requiresFeatureEvaluation: true,  // User needs to evaluate feature loss
    significantSavings: isSignificant,
  };
}

/**
 * Build confidence factors for a consolidation recommendation.
 */
export function consolidationConfidence(
  pricingVerified: boolean
): ConfidenceFactors {
  return {
    pricingVerifiedRecently: pricingVerified,
    sameVendorComparison: false,
    seatBasedPricing: true,
    usageAssumptionRequired: true,  // Assuming tools are interchangeable
    publicPricing: true,
    requiresFeatureEvaluation: true,
    significantSavings: true,
  };
}

/**
 * Build confidence factors for a credit/explore recommendation.
 */
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

/**
 * Check if pricing verification date is within the staleness window.
 * Default staleness threshold: 90 days.
 */
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
