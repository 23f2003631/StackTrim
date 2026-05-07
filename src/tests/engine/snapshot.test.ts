/**
 * Public Snapshot Sanitization Tests
 *
 * These tests ensure PII is NEVER leaked in public audit snapshots.
 * This is a security-critical test suite.
 */

import { describe, it, expect } from "vitest";
import {
  createPublicSnapshot,
  validateSnapshotPrivacy,
} from "@/lib/engine/snapshot";
import type { AuditResult } from "@/lib/types/audit";

/** Helper: create a realistic full audit result with PII */
function createTestAuditResult(overrides?: Partial<AuditResult>): AuditResult {
  return {
    id: "audit_test123_abc",
    input: {
      companyName: "Acme Corp",
      email: "cto@acme.com",
      teamSize: 8,
      notes: "Internal: exploring cost reduction before Q3 board meeting",
      tools: [
        {
          toolId: "cursor",
          planTier: "business",
          monthlySpend: 320,
          seats: 8,
          useCases: ["code-completion"],
        },
        {
          toolId: "github-copilot",
          planTier: "pro",
          monthlySpend: 80,
          seats: 8,
          useCases: ["code-completion"],
        },
      ],
    },
    recommendations: [
      {
        type: "consolidate",
        toolId: "github-copilot",
        toolName: "GitHub Copilot",
        currentSpend: 80,
        recommendedSpend: 0,
        monthlySavings: 80,
        annualSavings: 960,
        reasoning:
          "You have both Cursor and GitHub Copilot. Consider consolidating.",
        confidence: "medium",
      },
      {
        type: "downgrade",
        toolId: "cursor",
        toolName: "Cursor",
        currentSpend: 320,
        recommendedSpend: 160,
        monthlySavings: 160,
        annualSavings: 1920,
        reasoning: 'Consider "Pro" plan instead of "Business".',
        confidence: "medium",
      },
    ],
    totalMonthlySpend: 400,
    totalMonthlySavings: 240,
    totalAnnualSavings: 2880,
    savingsPercentage: 60,
    createdAt: "2026-05-07T12:00:00.000Z",
    catalogVersion: "2026.05.2",
    hasOverlappingTools: true,
    optimizedToolCount: 0,
    ...overrides,
  };
}

describe("Public Audit Snapshot", () => {
  describe("createPublicSnapshot", () => {
    it("should strip email from snapshot", () => {
      const result = createTestAuditResult();
      const snapshot = createPublicSnapshot(result);

      // Email must not appear anywhere
      const serialized = JSON.stringify(snapshot);
      expect(serialized).not.toContain("cto@acme.com");
      expect(serialized).not.toContain("email");
    });

    it("should strip company name from snapshot", () => {
      const result = createTestAuditResult();
      const snapshot = createPublicSnapshot(result);

      const serialized = JSON.stringify(snapshot);
      expect(serialized).not.toContain("Acme Corp");
      expect(serialized).not.toContain("companyName");
    });

    it("should strip internal notes from snapshot", () => {
      const result = createTestAuditResult();
      const snapshot = createPublicSnapshot(result);

      const serialized = JSON.stringify(snapshot);
      expect(serialized).not.toContain("board meeting");
      expect(serialized).not.toContain("notes");
    });

    it("should strip toolIds from recommendations", () => {
      const result = createTestAuditResult();
      const snapshot = createPublicSnapshot(result);

      for (const rec of snapshot.recommendations) {
        expect(rec).not.toHaveProperty("toolId");
        expect(rec).not.toHaveProperty("calculation");
      }
    });

    it("should preserve aggregate financial data", () => {
      const result = createTestAuditResult();
      const snapshot = createPublicSnapshot(result);

      expect(snapshot.totalMonthlySavings).toBe(result.totalMonthlySavings);
      expect(snapshot.totalAnnualSavings).toBe(result.totalAnnualSavings);
      expect(snapshot.savingsPercentage).toBe(result.savingsPercentage);
    });

    it("should preserve team size", () => {
      const result = createTestAuditResult();
      const snapshot = createPublicSnapshot(result);
      expect(snapshot.teamSize).toBe(8);
    });

    it("should preserve tool count", () => {
      const result = createTestAuditResult();
      const snapshot = createPublicSnapshot(result);
      expect(snapshot.toolCount).toBe(2);
    });

    it("should preserve recommendation types and reasoning", () => {
      const result = createTestAuditResult();
      const snapshot = createPublicSnapshot(result);

      expect(snapshot.recommendations.length).toBe(2);
      expect(snapshot.recommendations[0].type).toBe("consolidate");
      expect(snapshot.recommendations[0].reasoning).toBeTruthy();
    });

    it("should preserve catalog version and timestamp", () => {
      const result = createTestAuditResult();
      const snapshot = createPublicSnapshot(result);

      expect(snapshot.catalogVersion).toBe("2026.05.2");
      expect(snapshot.createdAt).toBeTruthy();
    });

    it("should sort tool names alphabetically", () => {
      const result = createTestAuditResult();
      const snapshot = createPublicSnapshot(result);

      const names = snapshot.toolNames;
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });
  });

  describe("validateSnapshotPrivacy", () => {
    it("should return true for clean snapshots", () => {
      const result = createTestAuditResult();
      const snapshot = createPublicSnapshot(result);
      expect(validateSnapshotPrivacy(snapshot)).toBe(true);
    });

    it("should return false if email leaks into snapshot", () => {
      const snapshot = {
        id: "test",
        teamSize: 5,
        toolCount: 1,
        toolNames: ["Test"],
        recommendations: [],
        totalMonthlySavings: 0,
        totalAnnualSavings: 0,
        savingsPercentage: 0,
        createdAt: "2026-01-01",
        catalogVersion: "1.0",
        // Simulating a leak (this shouldn't be possible via types, but defense-in-depth)
        email: "leaked@example.com",
      } as Record<string, unknown>;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateSnapshotPrivacy(snapshot as unknown as any)).toBe(false);
    });
  });

  describe("no-savings audit snapshot", () => {
    it("should create valid snapshot for zero-savings audit", () => {
      const result = createTestAuditResult({
        recommendations: [],
        totalMonthlySavings: 0,
        totalAnnualSavings: 0,
        savingsPercentage: 0,
      });

      const snapshot = createPublicSnapshot(result);

      expect(snapshot.recommendations).toHaveLength(0);
      expect(snapshot.totalMonthlySavings).toBe(0);
      expect(validateSnapshotPrivacy(snapshot)).toBe(true);
    });
  });
});
