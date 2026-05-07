/**
 * Calculation Utilities Tests
 *
 * Tests for pure financial calculation functions.
 * Every function is deterministic — same input always produces same output.
 */

import { describe, it, expect } from "vitest";
import {
  roundCurrency,
  monthlyToAnnual,
  annualToMonthly,
  seatCost,
  excessSeats,
  excessSeatSavings,
  downgradeSavings,
  isSignificantSavings,
  savingsPercentage,
  isHighSavings,
  normalizeToPerSeat,
  detectOverpayment,
  consolidationSavings,
  findOverlappingTools,
  rightsizingFormula,
  downgradeFormula,
  consolidationFormula,
} from "@/lib/engine/calculations";

describe("Calculation Utilities", () => {
  describe("roundCurrency", () => {
    it("should round to 2 decimal places", () => {
      expect(roundCurrency(10.555)).toBe(10.56);
      expect(roundCurrency(10.554)).toBe(10.55);
      expect(roundCurrency(100)).toBe(100);
    });

    it("should handle zero", () => {
      expect(roundCurrency(0)).toBe(0);
    });

    it("should handle negative values", () => {
      expect(roundCurrency(-10.555)).toBe(-10.55);
    });
  });

  describe("monthlyToAnnual", () => {
    it("should multiply by 12", () => {
      expect(monthlyToAnnual(100)).toBe(1200);
      expect(monthlyToAnnual(0)).toBe(0);
      expect(monthlyToAnnual(49.99)).toBe(599.88);
    });
  });

  describe("annualToMonthly", () => {
    it("should divide by 12", () => {
      expect(annualToMonthly(1200)).toBe(100);
      expect(annualToMonthly(0)).toBe(0);
    });

    it("should round correctly", () => {
      expect(annualToMonthly(100)).toBe(8.33);
    });
  });

  describe("seatCost", () => {
    it("should calculate seat × price", () => {
      expect(seatCost(5, 20)).toBe(100);
      expect(seatCost(1, 39)).toBe(39);
      expect(seatCost(0, 20)).toBe(0);
    });
  });

  describe("excessSeats", () => {
    it("should calculate excess correctly", () => {
      expect(excessSeats(10, 5)).toBe(5);
      expect(excessSeats(5, 5)).toBe(0);
      expect(excessSeats(3, 10)).toBe(0);
    });

    it("should never return negative", () => {
      expect(excessSeats(1, 100)).toBe(0);
    });
  });

  describe("excessSeatSavings", () => {
    it("should calculate savings for excess seats", () => {
      expect(excessSeatSavings(10, 5, 19)).toBe(95); // 5 excess × $19
    });

    it("should return 0 when no excess", () => {
      expect(excessSeatSavings(5, 5, 19)).toBe(0);
      expect(excessSeatSavings(3, 5, 19)).toBe(0);
    });
  });

  describe("downgradeSavings", () => {
    it("should calculate savings correctly", () => {
      expect(downgradeSavings(40, 20, 5)).toBe(100); // 5 × ($40 - $20)
      expect(downgradeSavings(19, 10, 3)).toBe(27);  // 3 × ($19 - $10)
    });

    it("should return 0 if cheaper plan costs more", () => {
      expect(downgradeSavings(10, 20, 5)).toBe(0);
    });

    it("should return 0 if same price", () => {
      expect(downgradeSavings(20, 20, 5)).toBe(0);
    });
  });

  describe("isSignificantSavings", () => {
    it("should return true when savings exceeds 15% threshold", () => {
      expect(isSignificantSavings(20, 100)).toBe(true);  // 20% > 15%
      expect(isSignificantSavings(15, 100)).toBe(true);  // 15% = 15%
    });

    it("should return false when savings below threshold", () => {
      expect(isSignificantSavings(10, 100)).toBe(false); // 10% < 15%
    });

    it("should handle zero current cost", () => {
      expect(isSignificantSavings(10, 0)).toBe(false);
    });

    it("should respect custom threshold", () => {
      expect(isSignificantSavings(5, 100, 0.05)).toBe(true);
      expect(isSignificantSavings(5, 100, 0.10)).toBe(false);
    });
  });

  describe("savingsPercentage", () => {
    it("should calculate correctly", () => {
      expect(savingsPercentage(25, 100)).toBe(25);
      expect(savingsPercentage(0, 100)).toBe(0);
    });

    it("should handle zero spend", () => {
      expect(savingsPercentage(10, 0)).toBe(0);
    });

    it("should round to whole number", () => {
      expect(savingsPercentage(33, 100)).toBe(33);
    });
  });

  describe("isHighSavings", () => {
    it("should return true when savings >= 20% of spend", () => {
      expect(isHighSavings(25, 100)).toBe(true);
      expect(isHighSavings(20, 100)).toBe(true);
    });

    it("should return false when savings < 20% of spend", () => {
      expect(isHighSavings(10, 100)).toBe(false);
    });

    it("should respect custom threshold", () => {
      expect(isHighSavings(10, 100, 10)).toBe(true);
      expect(isHighSavings(10, 100, 15)).toBe(false);
    });
  });

  describe("normalizeToPerSeat", () => {
    it("should calculate per-seat cost", () => {
      expect(normalizeToPerSeat(100, 5)).toBe(20);
    });

    it("should handle single seat", () => {
      expect(normalizeToPerSeat(39, 1)).toBe(39);
    });

    it("should handle zero seats", () => {
      expect(normalizeToPerSeat(100, 0)).toBe(0);
    });
  });

  describe("detectOverpayment", () => {
    it("should detect overpayment", () => {
      // Paying $300 but catalog says $19 × 10 = $190
      expect(detectOverpayment(300, 19, 10)).toBe(110);
    });

    it("should return 0 when spending matches or is below catalog", () => {
      expect(detectOverpayment(190, 19, 10)).toBe(0);
      expect(detectOverpayment(100, 19, 10)).toBe(0);
    });
  });

  describe("consolidationSavings", () => {
    it("should return minimum of two spends (conservative)", () => {
      expect(consolidationSavings(200, 100)).toBe(100);
      expect(consolidationSavings(50, 150)).toBe(50);
    });

    it("should handle equal spends", () => {
      expect(consolidationSavings(100, 100)).toBe(100);
    });

    it("should handle zero spend", () => {
      expect(consolidationSavings(100, 0)).toBe(0);
    });
  });

  describe("findOverlappingTools", () => {
    it("should detect tools in the same category", () => {
      const tools = [
        { toolId: "cursor", category: "ai-assistant" },
        { toolId: "github-copilot", category: "ai-assistant" },
        { toolId: "openai-api", category: "ai-api" },
      ];
      const overlaps = findOverlappingTools(tools);
      expect(overlaps.size).toBe(1);
      expect(overlaps.get("ai-assistant")).toEqual(["cursor", "github-copilot"]);
    });

    it("should return empty map when no overlaps", () => {
      const tools = [
        { toolId: "cursor", category: "ai-assistant" },
        { toolId: "openai-api", category: "ai-api" },
      ];
      const overlaps = findOverlappingTools(tools);
      expect(overlaps.size).toBe(0);
    });

    it("should detect multiple overlap groups", () => {
      const tools = [
        { toolId: "cursor", category: "ai-assistant" },
        { toolId: "copilot", category: "ai-assistant" },
        { toolId: "openai", category: "ai-api" },
        { toolId: "anthropic", category: "ai-api" },
      ];
      const overlaps = findOverlappingTools(tools);
      expect(overlaps.size).toBe(2);
    });
  });

  describe("formula builders", () => {
    it("rightsizingFormula handles singular/plural", () => {
      expect(rightsizingFormula(1, 19, 19)).toContain("1 excess seat");
      expect(rightsizingFormula(5, 19, 95)).toContain("5 excess seats");
    });

    it("downgradeFormula includes correct amounts", () => {
      const formula = downgradeFormula(5, 40, 20, 100);
      expect(formula).toContain("5 seats");
      expect(formula).toContain("$40");
      expect(formula).toContain("$20");
      expect(formula).toContain("$100/mo");
    });

    it("consolidationFormula includes tool name", () => {
      const formula = consolidationFormula("Cursor", 100);
      expect(formula).toContain("Cursor");
      expect(formula).toContain("$100/mo");
    });
  });
});
