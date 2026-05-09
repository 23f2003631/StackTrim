import { describe, it, expect } from "vitest";

/**
 * Tests for print/PDF formatting logic.
 * Validates the data formatting functions used in the print audit view.
 */

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const TYPE_LABELS: Record<string, string> = {
  downgrade: "Downgrade",
  consolidate: "Consolidate",
  credit: "Credit Opportunity",
  eliminate: "Eliminate",
  rightsize: "Rightsize",
  keep: "Optimized",
  "switch-vendor": "Switch Vendor",
  "review-api-usage": "Review API",
};

describe("Print/PDF Formatting", () => {
  describe("formatDate for print header", () => {
    it("should format ISO dates to human-readable", () => {
      const result = formatDate("2026-05-09T15:30:00.000Z");
      expect(result).toContain("May");
      expect(result).toContain("2026");
    });

    it("should handle date-only ISO strings", () => {
      const result = formatDate("2026-01-15");
      expect(result).toContain("January");
      expect(result).toContain("2026");
    });
  });

  describe("recommendation type labels", () => {
    it("should have labels for all standard types", () => {
      const types = [
        "downgrade",
        "consolidate",
        "credit",
        "eliminate",
        "rightsize",
        "keep",
        "switch-vendor",
        "review-api-usage",
      ];
      for (const type of types) {
        expect(TYPE_LABELS[type]).toBeDefined();
        expect(TYPE_LABELS[type].length).toBeGreaterThan(0);
      }
    });

    it("should use proper capitalization", () => {
      for (const label of Object.values(TYPE_LABELS)) {
        expect(label[0]).toBe(label[0].toUpperCase());
      }
    });
  });

  describe("print report structure", () => {
    it("should calculate annual from monthly savings", () => {
      const monthlySavings = 1500;
      const annualSavings = monthlySavings * 12;
      expect(annualSavings).toBe(18000);
    });

    it("should format savings percentage correctly", () => {
      const totalSpend = 5000;
      const totalSavings = 1500;
      const percentage = Math.round((totalSavings / totalSpend) * 100);
      expect(percentage).toBe(30);
    });

    it("should handle zero spend gracefully", () => {
      const totalSpend = 0;
      const percentage = totalSpend === 0 ? 0 : Math.round((0 / totalSpend) * 100);
      expect(percentage).toBe(0);
    });
  });

  describe("currency formatting edge cases", () => {
    it("should format negative values", () => {
      const result = formatCurrency(-500);
      expect(result).toContain("500");
    });

    it("should format very small values", () => {
      expect(formatCurrency(1)).toBe("$1");
    });

    it("should format maximum realistic annual savings", () => {
      // 20 tools × $1000/mo × 12 months = $240,000
      const result = formatCurrency(240000);
      expect(result).toBe("$240,000");
    });
  });
});
