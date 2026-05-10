import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate } from "@/lib/utils/format";

describe("Formatting Utilities", () => {
  describe("formatCurrency", () => {
    it("formats 0 correctly", () => {
      expect(formatCurrency(0)).toBe("$0");
    });

    it("formats positive numbers with commas", () => {
      expect(formatCurrency(1234)).toBe("$1,234");
      expect(formatCurrency(1000000)).toBe("$1,000,000");
    });

    it("strips decimal values", () => {
      expect(formatCurrency(123.45)).toBe("$123");
      expect(formatCurrency(123.99)).toBe("$124"); // rounds up
    });
  });

  describe("formatDate", () => {
    it("formats ISO date strings correctly", () => {
      const dateStr = "2026-05-10T12:00:00Z";
      expect(formatDate(dateStr)).toBe("May 10, 2026");
    });
  });
});
