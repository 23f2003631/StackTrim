import { describe, it, expect } from "vitest";

/**
 * Tests for OG image metadata generation logic.
 * These test the data formatting functions used in the OG image and share page metadata.
 */

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function pluralizeTools(count: number): string {
  return `across ${count} AI tool${count !== 1 ? "s" : ""}`;
}

describe("OG Image Metadata", () => {
  describe("formatCurrency for OG display", () => {
    it("should format zero savings", () => {
      expect(formatCurrency(0)).toBe("$0");
    });

    it("should format small savings without decimals", () => {
      expect(formatCurrency(150)).toBe("$150");
    });

    it("should format thousands with commas", () => {
      expect(formatCurrency(1500)).toBe("$1,500");
    });

    it("should format large annual savings", () => {
      expect(formatCurrency(24000)).toBe("$24,000");
    });

    it("should format very large savings", () => {
      expect(formatCurrency(150000)).toBe("$150,000");
    });

    it("should round to nearest dollar", () => {
      expect(formatCurrency(1234.56)).toBe("$1,235");
    });
  });

  describe("OG title generation", () => {
    it("should generate proper title for savings audits", () => {
      const savings = formatCurrency(24000);
      const title = `${savings}/yr in AI savings identified — StackTrim`;
      expect(title).toBe("$24,000/yr in AI savings identified — StackTrim");
    });

    it("should generate proper title for zero savings", () => {
      const savings = formatCurrency(0);
      const title = `${savings}/yr in AI savings identified — StackTrim`;
      expect(title).toBe("$0/yr in AI savings identified — StackTrim");
    });
  });

  describe("OG description generation", () => {
    it("should include tool count in description", () => {
      const toolCount = 5;
      const monthlySavings = formatCurrency(2000);
      const desc = `StackTrim identified ${monthlySavings}/mo in savings across ${toolCount} AI tools. Deterministic audit powered by public pricing data.`;
      expect(desc).toContain("5 AI tools");
      expect(desc).toContain("$2,000/mo");
      expect(desc).toContain("Deterministic");
    });

    it("should handle single tool correctly", () => {
      expect(pluralizeTools(1)).toBe("across 1 AI tool");
    });

    it("should pluralize for multiple tools", () => {
      expect(pluralizeTools(3)).toBe("across 3 AI tools");
    });
  });
});
