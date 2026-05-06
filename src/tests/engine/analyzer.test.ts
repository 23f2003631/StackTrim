/**
 * Audit Analyzer Tests
 *
 * Tests for the core audit engine — the most critical
 * business logic in the entire product.
 */

import { describe, it, expect } from "vitest";
import { analyzeToolSpend, generateAuditResult } from "@/lib/engine/analyzer";
import { getToolById } from "@/lib/engine/catalog";
import type { ToolEntry, AuditInput } from "@/lib/types/audit";
import type { ToolCatalogEntry } from "@/lib/types/catalog";

describe("Audit Analyzer", () => {
  describe("analyzeToolSpend", () => {
    it("should detect excess seats", () => {
      const entry: ToolEntry = {
        toolId: "github-copilot",
        planTier: "business",
        monthlySpend: 190,
        seats: 10,
        useCases: ["code-completion"],
      };
      const catalog = getToolById("github-copilot") as ToolCatalogEntry;
      const recs = analyzeToolSpend(entry, 5, catalog);

      const rightsizeRec = recs.find((r) => r.type === "rightsize");
      expect(rightsizeRec).toBeDefined();
      expect(rightsizeRec!.monthlySavings).toBe(5 * 19); // 5 excess seats × $19/seat
    });

    it("should suggest plan downgrade when savings exceed 15%", () => {
      const entry: ToolEntry = {
        toolId: "cursor",
        planTier: "business",
        monthlySpend: 200,
        seats: 5,
        useCases: ["code-completion"],
      };
      const catalog = getToolById("cursor") as ToolCatalogEntry;
      const recs = analyzeToolSpend(entry, 5, catalog);

      const downgradeRec = recs.find((r) => r.type === "downgrade");
      expect(downgradeRec).toBeDefined();
      expect(downgradeRec!.monthlySavings).toBe(5 * (40 - 20)); // 5 seats × $20 diff
    });

    it("should not suggest downgrade for lowest-tier plans", () => {
      const entry: ToolEntry = {
        toolId: "github-copilot",
        planTier: "free",
        monthlySpend: 0,
        seats: 1,
        useCases: ["code-completion"],
      };
      const catalog = getToolById("github-copilot") as ToolCatalogEntry;
      const recs = analyzeToolSpend(entry, 5, catalog);

      const downgradeRec = recs.find((r) => r.type === "downgrade");
      expect(downgradeRec).toBeUndefined();
    });

    it("should flag credit opportunities", () => {
      const entry: ToolEntry = {
        toolId: "openai-api",
        planTier: "team",
        monthlySpend: 250,
        seats: 10,
        useCases: ["api-calls"],
      };
      const catalog = getToolById("openai-api") as ToolCatalogEntry;
      const recs = analyzeToolSpend(entry, 10, catalog);

      const creditRec = recs.find((r) => r.type === "credit");
      expect(creditRec).toBeDefined();
      expect(creditRec!.reasoning).toContain("credit");
    });

    it("should return no rightsizing for correctly-sized seats", () => {
      const entry: ToolEntry = {
        toolId: "github-copilot",
        planTier: "pro",
        monthlySpend: 50,
        seats: 5,
        useCases: ["code-completion"],
      };
      const catalog = getToolById("github-copilot") as ToolCatalogEntry;
      const recs = analyzeToolSpend(entry, 5, catalog);

      const rightsizeRec = recs.find((r) => r.type === "rightsize");
      expect(rightsizeRec).toBeUndefined();
    });
  });

  describe("generateAuditResult", () => {
    it("should produce a valid audit result", () => {
      const input: AuditInput = {
        companyName: "Test Corp",
        teamSize: 5,
        tools: [
          {
            toolId: "github-copilot",
            planTier: "enterprise",
            monthlySpend: 390,
            seats: 10,
            useCases: ["code-completion"],
          },
        ],
      };

      const result = generateAuditResult(input);

      expect(result.id).toBeTruthy();
      expect(result.id).toMatch(/^audit_/);
      expect(result.totalMonthlySpend).toBe(390);
      expect(result.totalMonthlySavings).toBeGreaterThanOrEqual(0);
      expect(result.totalAnnualSavings).toBe(result.totalMonthlySavings * 12);
      expect(result.createdAt).toBeTruthy();
    });

    it("should sort recommendations by savings descending", () => {
      const input: AuditInput = {
        teamSize: 3,
        tools: [
          {
            toolId: "github-copilot",
            planTier: "enterprise",
            monthlySpend: 390,
            seats: 10,
            useCases: [],
          },
          {
            toolId: "cursor",
            planTier: "business",
            monthlySpend: 400,
            seats: 10,
            useCases: [],
          },
        ],
      };

      const result = generateAuditResult(input);
      const savingsRecs = result.recommendations.filter(
        (r) => r.monthlySavings > 0
      );

      for (let i = 1; i < savingsRecs.length; i++) {
        expect(savingsRecs[i].monthlySavings).toBeLessThanOrEqual(
          savingsRecs[i - 1].monthlySavings
        );
      }
    });

    it("should handle empty tools array gracefully", () => {
      const input: AuditInput = {
        teamSize: 5,
        tools: [],
      };

      const result = generateAuditResult(input);

      expect(result.recommendations).toHaveLength(0);
      expect(result.totalMonthlySpend).toBe(0);
      expect(result.totalMonthlySavings).toBe(0);
    });

    it("should skip unknown tools without crashing", () => {
      const input: AuditInput = {
        teamSize: 5,
        tools: [
          {
            toolId: "nonexistent-tool",
            planTier: "pro",
            monthlySpend: 100,
            seats: 5,
            useCases: [],
          },
        ],
      };

      const result = generateAuditResult(input);
      // Should not throw, just produce no recommendations for unknown tools
      expect(result.totalMonthlySpend).toBe(100);
    });
  });
});
