/**
 * Audit Analyzer Tests
 *
 * Tests for the core audit engine — the most critical
 * business logic in the entire product.
 *
 * @version 2.0 — Day 2: added overlap detection, keep recs,
 *                no-savings honesty, high-savings threshold,
 *                calculation breakdown verification
 */

import { describe, it, expect } from "vitest";
import {
  analyzeToolSpend,
  generateAuditResult,
  analyzeToolOverlaps,
} from "@/lib/engine/analyzer";
import { getToolById } from "@/lib/engine/catalog";
import type { ToolEntry, AuditInput } from "@/lib/types/audit";
import type { ToolCatalogEntry } from "@/lib/types/catalog";

describe("Audit Analyzer", () => {
  // =========================================================================
  // Per-tool analysis
  // =========================================================================
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
      // REALISM: 5 excess seats. Reduction ratio 0.7 -> 3 seats removed. 3 * $19 = $57.
      expect(rightsizeRec!.monthlySavings).toBe(57); 
    });

    it("should include calculation breakdown for rightsizing", () => {
      const entry: ToolEntry = {
        toolId: "github-copilot",
        planTier: "business",
        monthlySpend: 190,
        seats: 10,
        useCases: [],
      };
      const catalog = getToolById("github-copilot") as ToolCatalogEntry;
      const recs = analyzeToolSpend(entry, 5, catalog);

      const rightsizeRec = recs.find((r) => r.type === "rightsize");
      expect(rightsizeRec?.calculation).toBeDefined();
      expect(rightsizeRec!.calculation!.formula).toContain("5 excess seats");
      expect(rightsizeRec!.calculation!.seatCount).toBe(5);
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

    it("should include calculation breakdown for downgrade", () => {
      const entry: ToolEntry = {
        toolId: "cursor",
        planTier: "business",
        monthlySpend: 200,
        seats: 5,
        useCases: [],
      };
      const catalog = getToolById("cursor") as ToolCatalogEntry;
      const recs = analyzeToolSpend(entry, 5, catalog);

      const downgradeRec = recs.find((r) => r.type === "downgrade");
      expect(downgradeRec?.calculation).toBeDefined();
      expect(downgradeRec!.calculation!.currentPlanName).toBe("Business");
      expect(downgradeRec!.calculation!.recommendedPlanName).toBe("Pro");
      expect(downgradeRec!.calculation!.formula).toContain("5 seats");
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

    it("should assign confidence levels to all recommendations", () => {
      const entry: ToolEntry = {
        toolId: "github-copilot",
        planTier: "enterprise",
        monthlySpend: 390,
        seats: 10,
        useCases: [],
      };
      const catalog = getToolById("github-copilot") as ToolCatalogEntry;
      const recs = analyzeToolSpend(entry, 5, catalog);

      for (const rec of recs) {
        expect(["high", "medium", "low"]).toContain(rec.confidence);
      }
    });

    it("should calculate annualSavings as monthlySavings × 12", () => {
      const entry: ToolEntry = {
        toolId: "cursor",
        planTier: "business",
        monthlySpend: 200,
        seats: 5,
        useCases: [],
      };
      const catalog = getToolById("cursor") as ToolCatalogEntry;
      const recs = analyzeToolSpend(entry, 5, catalog);

      for (const rec of recs) {
        if (rec.monthlySavings > 0) {
          expect(rec.annualSavings).toBe(rec.monthlySavings * 12);
        }
      }
    });
  });

  // =========================================================================
  // Overlap / Consolidation detection
  // =========================================================================
  describe("analyzeToolOverlaps", () => {
    it("should detect duplicate AI assistants", () => {
      const entries: ToolEntry[] = [
        {
          toolId: "cursor",
          planTier: "pro",
          monthlySpend: 100,
          seats: 5,
          useCases: [],
        },
        {
          toolId: "github-copilot",
          planTier: "pro",
          monthlySpend: 50,
          seats: 5,
          useCases: [],
        },
      ];
      const recs = analyzeToolOverlaps(entries, getToolById);
      const consolidationRecs = recs.filter((r) => r.type === "consolidate");
      expect(consolidationRecs.length).toBeGreaterThanOrEqual(1);
    });

    it("should recommend dropping the cheaper tool", () => {
      const entries: ToolEntry[] = [
        {
          toolId: "cursor",
          planTier: "pro",
          monthlySpend: 200,
          seats: 10,
          useCases: [],
        },
        {
          toolId: "github-copilot",
          planTier: "pro",
          monthlySpend: 50,
          seats: 5,
          useCases: [],
        },
      ];
      const recs = analyzeToolOverlaps(entries, getToolById);
      const consolidationRec = recs.find((r) => r.type === "consolidate");
      expect(consolidationRec).toBeDefined();
      // Conservative: savings = min of the two spends = $50
      expect(consolidationRec!.monthlySavings).toBe(50);
    });

    it("should not suggest consolidation for different categories", () => {
      const entries: ToolEntry[] = [
        {
          toolId: "cursor",
          planTier: "pro",
          monthlySpend: 100,
          seats: 5,
          useCases: [],
        },
        {
          toolId: "openai-api",
          planTier: "team",
          monthlySpend: 250,
          seats: 10,
          useCases: [],
        },
      ];
      const recs = analyzeToolOverlaps(entries, getToolById);
      const consolidationRecs = recs.filter((r) => r.type === "consolidate");
      expect(consolidationRecs).toHaveLength(0);
    });

    it("should handle three overlapping tools", () => {
      const entries: ToolEntry[] = [
        { toolId: "cursor", planTier: "pro", monthlySpend: 200, seats: 10, useCases: [] },
        { toolId: "github-copilot", planTier: "pro", monthlySpend: 100, seats: 10, useCases: [] },
        { toolId: "codeium", planTier: "pro", monthlySpend: 75, seats: 5, useCases: [] },
      ];
      const recs = analyzeToolOverlaps(entries, getToolById);
      const consolidationRecs = recs.filter((r) => r.type === "consolidate");
      // Should suggest dropping 2 of the 3
      expect(consolidationRecs.length).toBe(2);
    });
  });

  // =========================================================================
  // Full audit generation
  // =========================================================================
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

    it("should include catalogVersion", () => {
      const input: AuditInput = { teamSize: 5, tools: [] };
      const result = generateAuditResult(input);
      expect(result.catalogVersion).toBeTruthy();
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

    it("should assign priority ranks to recommendations", () => {
      const input: AuditInput = {
        teamSize: 3,
        tools: [
          { toolId: "cursor", planTier: "business", monthlySpend: 400, seats: 10, useCases: [] },
        ],
      };

      const result = generateAuditResult(input);
      for (const rec of result.recommendations) {
        expect(rec.priority).toBeDefined();
        expect(rec.priority).toBeGreaterThan(0);
      }
    });

    it("should detect overlapping tools", () => {
      const input: AuditInput = {
        teamSize: 5,
        tools: [
          { toolId: "cursor", planTier: "pro", monthlySpend: 100, seats: 5, useCases: [] },
          { toolId: "github-copilot", planTier: "pro", monthlySpend: 50, seats: 5, useCases: [] },
        ],
      };

      const result = generateAuditResult(input);
      expect(result.hasOverlappingTools).toBe(true);
    });

    it("should report no overlaps for single-category tools", () => {
      const input: AuditInput = {
        teamSize: 5,
        tools: [
          { toolId: "cursor", planTier: "pro", monthlySpend: 100, seats: 5, useCases: [] },
          { toolId: "openai-api", planTier: "plus", monthlySpend: 100, seats: 5, useCases: [] },
        ],
      };

      const result = generateAuditResult(input);
      expect(result.hasOverlappingTools).toBe(false);
    });
  });

  // =========================================================================
  // Honest "no savings" cases
  // =========================================================================
  describe("honest no-savings results", () => {
    it("should produce 0 savings for already-optimized stack", () => {
      const input: AuditInput = {
        teamSize: 5,
        tools: [
          {
            toolId: "github-copilot",
            planTier: "free",
            monthlySpend: 0,
            seats: 1,
            useCases: [],
          },
        ],
      };

      const result = generateAuditResult(input);
      const savingsRecs = result.recommendations.filter(
        (r) => r.monthlySavings > 0
      );
      expect(savingsRecs).toHaveLength(0);
      expect(result.totalMonthlySavings).toBe(0);
    });

    it("should generate 'keep' recommendations for optimized tools", () => {
      const input: AuditInput = {
        teamSize: 5,
        tools: [
          {
            toolId: "github-copilot",
            planTier: "free",
            monthlySpend: 0,
            seats: 1,
            useCases: [],
          },
        ],
      };

      const result = generateAuditResult(input);
      const keepRecs = result.recommendations.filter((r) => r.type === "keep");
      expect(keepRecs.length).toBeGreaterThanOrEqual(1);
      expect(keepRecs[0].reasoning).toContain("lowest available plan");
    });

    it("should report savingsPercentage of 0 when no savings found", () => {
      const input: AuditInput = {
        teamSize: 5,
        tools: [
          {
            toolId: "github-copilot",
            planTier: "free",
            monthlySpend: 0,
            seats: 1,
            useCases: [],
          },
        ],
      };

      const result = generateAuditResult(input);
      expect(result.savingsPercentage).toBe(0);
    });
  });

  // =========================================================================
  // High-savings threshold detection
  // =========================================================================
  describe("high-savings detection", () => {
    it("should identify high savings when percentage >= 20%", () => {
      const input: AuditInput = {
        teamSize: 5,
        tools: [
          {
            toolId: "cursor",
            planTier: "business",
            monthlySpend: 200,
            seats: 5,
            useCases: [],
          },
        ],
      };

      const result = generateAuditResult(input);
      // Downgrade from Business ($40) to Pro ($20) = $100/mo savings on $200 = 50%
      expect(result.savingsPercentage).toBeGreaterThanOrEqual(20);
    });
  });

  // =========================================================================
  // Edge cases and invalid input handling
  // =========================================================================
  describe("edge cases", () => {
    it("should handle single-seat user", () => {
      const input: AuditInput = {
        teamSize: 1,
        tools: [
          {
            toolId: "cursor",
            planTier: "business",
            monthlySpend: 40,
            seats: 1,
            useCases: [],
          },
        ],
      };

      const result = generateAuditResult(input);
      // Should still suggest downgrade but no rightsizing
      const rightsizeRec = result.recommendations.find(
        (r) => r.type === "rightsize"
      );
      expect(rightsizeRec).toBeUndefined();
    });

    it("should handle tool with 0 monthly spend gracefully", () => {
      const input: AuditInput = {
        teamSize: 5,
        tools: [
          {
            toolId: "github-copilot",
            planTier: "pro",
            monthlySpend: 0,
            seats: 5,
            useCases: [],
          },
        ],
      };

      const result = generateAuditResult(input);
      expect(result.totalMonthlySpend).toBe(0);
      // No crash, graceful handling
    });

    it("should handle very large team size", () => {
      const input: AuditInput = {
        teamSize: 500,
        tools: [
          {
            toolId: "github-copilot",
            planTier: "business",
            monthlySpend: 1900,
            seats: 100,
            useCases: [],
          },
        ],
      };

      const result = generateAuditResult(input);
      // seats (100) < teamSize (500), so no rightsizing
      const rightsizeRec = result.recommendations.find(
        (r) => r.type === "rightsize"
      );
      expect(rightsizeRec).toBeUndefined();
    });
  });
});
