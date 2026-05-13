import type {
  AuditResult,
  PublicAuditSnapshot,
  PublicRecommendation,
  Recommendation,
} from "@/lib/types/audit";

export function createPublicSnapshot(result: AuditResult): PublicAuditSnapshot {
  return {
    id: result.id,
    teamSize: result.input.teamSize,
    toolCount: result.input.tools.length,
    toolNames: extractUniqueToolNames(result),
    recommendations: result.recommendations.map(sanitizeRecommendation),
    totalMonthlySpend: result.totalMonthlySpend,
    totalMonthlySavings: result.totalMonthlySavings,
    totalAnnualSavings: result.totalAnnualSavings,
    savingsPercentage: result.savingsPercentage,
    createdAt: result.createdAt,
    catalogVersion: result.catalogVersion,
    engineVersion: "1.0.0",
    metadata: {
      hasHighSavings: result.savingsPercentage >= 15,
      hasOverlappingTools: result.hasOverlappingTools,
      optimizedToolCount: result.optimizedToolCount,
      usedManualOverride: result.usedManualOverride,
      maxMismatchSeverity: result.maxMismatchSeverity,
      savingsRealismLevel: result.savingsRealismLevel,
    },
  };
}

function extractUniqueToolNames(result: AuditResult): string[] {
  const nameSet = new Set<string>();

  for (const rec of result.recommendations) {
    nameSet.add(rec.toolName);
  }

  return Array.from(nameSet).sort();
}

function sanitizeRecommendation(rec: Recommendation): PublicRecommendation {
  return {
    type: rec.type,
    toolName: rec.toolName,
    reasoning: rec.reasoning,
    confidence: rec.confidence,
    monthlySavings: rec.monthlySavings,
    annualSavings: rec.annualSavings,
    customContractLikely: rec.pricingConsistency?.customContractLikely,
    contextualNote: rec.contextualNote,
    modifies: rec.modifies,
    reasoningDetails: rec.reasoningDetails,
    catalogVersion: rec.catalogVersion,
  };
}

export function validateSnapshotPrivacy(snapshot: PublicAuditSnapshot): boolean {
  const raw = JSON.stringify(snapshot);

  const hasEmailPattern = /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(raw);
  if (hasEmailPattern) {
    return false;
  }

  const obj = snapshot as unknown as Record<string, unknown>;
  if ("email" in obj || "companyName" in obj || "notes" in obj) {
    return false;
  }

  return true;
}
