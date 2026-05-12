import { describe, it, expect } from "vitest";
import { generateAuditResult } from "@/lib/engine/analyzer";
import type { AuditInput } from "@/lib/types/audit";

describe("Sequential Optimization Pipeline", () => {
  it("should calculate additive savings correctly without double-counting", () => {
    // Scenario: Vercel Enterprise with 11 seats.
    // Price: $50/seat (Enterprise) -> $20/seat (Pro) -> $0 (Rightsizing)
    // Team size: 5
    // Monthly spend: $550 (11 * 50)
    
    const input: AuditInput = {
      teamSize: 5,
      tools: [
        {
          toolId: "vercel",
          planTier: "enterprise",
          monthlySpend: 550,
          seats: 11,
          useCases: ["hosting"]
        }
      ]
    };

    const result = generateAuditResult(input);

    // Initial Spend: 550
    // Step 1: Downgrade to Pro ($20/seat)
    //   11 seats * $20 = $220. Savings = 550 - 220 = $330.
    // Step 2: Rightsize to team size (5 seats)
    //   5 seats * $20 = $100. Savings = 220 - 100 = $120.
    // Total Savings should be 330 + 120 = $450.
    // Final Optimized Spend should be $100.

    expect(result.totalMonthlySpend).toBe(550);
    expect(result.totalMonthlySavings).toBe(450);
    expect(result.totalMonthlySavings / result.totalMonthlySpend).toBeCloseTo(0.818, 3);
    
    // Check recommendations
    const downgrade = result.recommendations.find(r => r.type === "downgrade");
    const rightsize = result.recommendations.find(r => r.type === "rightsize");

    expect(downgrade?.monthlySavings).toBe(330);
    expect(rightsize?.monthlySavings).toBe(120);
    expect(rightsize?.contextualNote).toBe("Assumes previous plan optimization");
  });

  it("should prevent impossible savings (> 100%)", () => {
    const input: AuditInput = {
      teamSize: 1,
      tools: [
        {
          toolId: "linear",
          planTier: "plus",
          monthlySpend: 100, // Artificially high spend
          seats: 10,
          useCases: ["planning"]
        }
      ]
    };

    const result = generateAuditResult(input);
    
    expect(result.totalMonthlySavings).toBeLessThanOrEqual(result.totalMonthlySpend);
    expect(result.savingsPercentage).toBeLessThanOrEqual(100);
  });

  it("should handle consolidation first, then optimize the remaining tools", () => {
    // Scenario: Two AI assistants (GitHub Copilot and Cursor)
    // Consolidation should drop one.
    const input: AuditInput = {
      teamSize: 10,
      tools: [
        {
          toolId: "github-copilot",
          planTier: "business",
          monthlySpend: 190, // $19/seat * 10
          seats: 10,
          useCases: ["coding"]
        },
        {
          toolId: "cursor",
          planTier: "business",
          monthlySpend: 200, // $20/seat * 10
          seats: 10,
          useCases: ["coding"]
        }
      ]
    };

    const result = generateAuditResult(input);
    
    const consolidation = result.recommendations.find(r => r.type === "consolidate");
    expect(consolidation).toBeDefined();
    
    // After consolidation, one tool spend is 0, so no further savings should be counted for it.
    const droppedToolId = consolidation?.toolId;
    const recsForDroppedTool = result.recommendations.filter(r => r.toolId === droppedToolId && r.type !== "consolidate");
    
    // There might be a 'keep' or 'credit' but no more 'savings'
    const savingsForDroppedTool = recsForDroppedTool.reduce((sum, r) => sum + r.monthlySavings, 0);
    expect(savingsForDroppedTool).toBe(0);
  });
});
