/**
 * Public Audit Snapshot — Sanitization Layer
 *
 * Converts a full AuditResult into a PublicAuditSnapshot by stripping
 * all personally identifiable information (PII) and sensitive metadata.
 *
 * This module exists to ensure we NEVER accidentally leak:
 * - Email addresses
 * - Company names
 * - Internal notes
 * - Per-tool spend breakdowns (aggregates only)
 * - Tool IDs (display names only)
 *
 * Architecture:
 * - AuditResult (private, full) → createPublicSnapshot() → PublicAuditSnapshot (safe to share)
 *
 * @module engine/snapshot
 */

import type {
  AuditResult,
  PublicAuditSnapshot,
  PublicRecommendation,
  Recommendation,
} from "@/lib/types/audit";

// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------

/**
 * Create a public-safe snapshot from a full audit result.
 *
 * Strips:
 * - companyName
 * - email
 * - notes
 * - per-tool spend amounts in input
 * - toolIds (replaced with display names)
 * - calculation breakdowns with seat-level pricing
 *
 * Keeps:
 * - aggregate savings figures
 * - recommendation types and reasoning
 * - tool display names
 * - confidence levels
 */
export function createPublicSnapshot(result: AuditResult): PublicAuditSnapshot {
  return {
    id: result.id,
    teamSize: result.input.teamSize,
    toolCount: result.input.tools.length,
    toolNames: extractUniqueToolNames(result),
    recommendations: result.recommendations.map(sanitizeRecommendation),
    totalMonthlySavings: result.totalMonthlySavings,
    totalAnnualSavings: result.totalAnnualSavings,
    savingsPercentage: result.savingsPercentage,
    createdAt: result.createdAt,
    catalogVersion: result.catalogVersion,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Extract unique tool display names from audit result.
 * Uses recommendation tool names rather than raw IDs.
 */
function extractUniqueToolNames(result: AuditResult): string[] {
  const nameSet = new Set<string>();

  // Get names from recommendations
  for (const rec of result.recommendations) {
    nameSet.add(rec.toolName);
  }

  // If no recommendations, we still want tool names
  // But we can't safely include them without catalog lookups
  // This is by design — if there are no recommendations,
  // the tool names in the public snapshot may be empty.
  // That's acceptable for privacy-first design.

  return Array.from(nameSet).sort();
}

/**
 * Convert a full Recommendation to a PublicRecommendation.
 * Strips toolId, calculation details, and priority.
 */
function sanitizeRecommendation(rec: Recommendation): PublicRecommendation {
  return {
    type: rec.type,
    toolName: rec.toolName,
    reasoning: rec.reasoning,
    confidence: rec.confidence,
    monthlySavings: rec.monthlySavings,
    annualSavings: rec.annualSavings,
  };
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Verify that a public snapshot contains no PII.
 * Used in tests to assert sanitization correctness.
 *
 * Returns true if the snapshot is clean.
 * Returns false (with console.warn) if PII is detected.
 */
export function validateSnapshotPrivacy(snapshot: PublicAuditSnapshot): boolean {
  // Check that known PII fields don't exist
  const raw = JSON.stringify(snapshot);

  // Snapshot should not contain common PII patterns
  // Note: This is a defense-in-depth check, not a primary defense.
  // The primary defense is the type system (PublicAuditSnapshot simply
  // doesn't have email/companyName fields).

  const hasEmailPattern = /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(raw);
  if (hasEmailPattern) {
    return false;
  }

  // Verify structural absence of sensitive fields
  const obj = snapshot as unknown as Record<string, unknown>;
  if ("email" in obj || "companyName" in obj || "notes" in obj) {
    return false;
  }

  return true;
}
