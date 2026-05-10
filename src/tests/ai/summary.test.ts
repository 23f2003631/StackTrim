import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateAuditSummary } from "../../lib/ai/summary";
import { PublicAuditSnapshot } from "../../lib/types/audit";

// Mock the genai module
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: vi.fn().mockRejectedValue(new Error("Timeout")),
      };
    },
  };
});

describe("AI Summary Generation", () => {
  const mockSnapshot: PublicAuditSnapshot = {
    id: "test-id",
    teamSize: 10,
    toolCount: 5,
    toolNames: ["Tool A", "Tool B"],
    totalMonthlySpend: 1000,
    totalMonthlySavings: 200,
    totalAnnualSavings: 2400,
    savingsPercentage: 20,
    recommendations: [
      {
        type: "downgrade",
        toolName: "Tool A",
        reasoning: "Reasoning",
        confidence: "high",
        monthlySavings: 200,
        annualSavings: 2400,
      }
    ],
    createdAt: new Date().toISOString(),
    catalogVersion: "1.0",
    engineVersion: "1.0",
    metadata: {
      hasHighSavings: false,
      hasOverlappingTools: false,
      optimizedToolCount: 4,
    }
  };

  beforeEach(() => {
    // Ensure the key exists to bypass the immediate fallback check
    process.env.GEMINI_API_KEY = "mock-key";
  });

  it("should trigger deterministic fallback when Gemini fails", async () => {
    const { summary, status } = await generateAuditSummary(mockSnapshot);
    
    expect(summary).toContain("We analyzed your stack of 5 tools ($1000/mo)");
    expect(summary).toContain("identified 1 optimization opportunity");
    expect(summary).toContain("save $200 per month");
    expect(status).toBe("ai_summary_timeout");
  });

  it("should return an honest optimized message if savings are 0", async () => {
    const optimizedSnapshot = {
      ...mockSnapshot,
      totalMonthlySavings: 0,
      recommendations: []
    };
    
    const { summary, status } = await generateAuditSummary(optimizedSnapshot);
    
    expect(summary).toContain("appears highly optimized");
    expect(summary).toContain("We did not identify any immediate cost-saving opportunities");
    expect(status).toBe("ai_summary_timeout");
  });
});
