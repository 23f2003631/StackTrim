/**
 * Pricing Catalog Tests
 *
 * These tests verify the integrity of our pricing data.
 * This is the highest-risk area of the product — if catalog data
 * is malformed, every audit result is wrong.
 */

import { describe, it, expect } from "vitest";
import {
  pricingCatalog,
  getToolById,
  getPlanForTool,
  getToolsByCategory,
  getCategories,
} from "@/lib/engine/catalog";

describe("Pricing Catalog", () => {
  describe("data integrity", () => {
    it("should contain at least 5 tools", () => {
      expect(pricingCatalog.tools.length).toBeGreaterThanOrEqual(5);
    });

    it("should have a valid version string", () => {
      expect(pricingCatalog.version).toBeTruthy();
      expect(pricingCatalog.lastUpdated).toBeTruthy();
    });

    it("every tool should have a unique id", () => {
      const ids = pricingCatalog.tools.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("every tool should have at least one plan", () => {
      for (const tool of pricingCatalog.tools) {
        expect(tool.plans.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("every plan should have non-negative pricing", () => {
      for (const tool of pricingCatalog.tools) {
        for (const plan of tool.plans) {
          expect(plan.monthlyPricePerSeat).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it("every tool should have a valid category", () => {
      const validCategories = [
        "ai-assistant",
        "ai-api",
        "ai-platform",
        "cloud-infra",
        "data",
        "monitoring",
        "productivity",
        "design",
        "other",
      ];
      for (const tool of pricingCatalog.tools) {
        expect(validCategories).toContain(tool.category);
      }
    });

    it("every tool should have a pricing URL", () => {
      for (const tool of pricingCatalog.tools) {
        expect(tool.pricingUrl).toBeTruthy();
        expect(tool.pricingUrl).toMatch(/^https?:\/\//);
      }
    });

    it("plans should be ordered from cheapest to most expensive", () => {
      for (const tool of pricingCatalog.tools) {
        for (let i = 1; i < tool.plans.length; i++) {
          expect(tool.plans[i].monthlyPricePerSeat).toBeGreaterThanOrEqual(
            tool.plans[i - 1].monthlyPricePerSeat
          );
        }
      }
    });
  });

  describe("lookup helpers", () => {
    it("getToolById returns correct tool", () => {
      const tool = getToolById("github-copilot");
      expect(tool).toBeDefined();
      expect(tool!.name).toBe("GitHub Copilot");
    });

    it("getToolById returns undefined for unknown tool", () => {
      const tool = getToolById("nonexistent-tool");
      expect(tool).toBeUndefined();
    });

    it("getPlanForTool returns correct plan", () => {
      const result = getPlanForTool("github-copilot", "pro");
      expect(result).toBeDefined();
      expect(result!.plan.name).toBe("Pro");
      expect(result!.plan.monthlyPricePerSeat).toBe(10);
    });

    it("getPlanForTool returns undefined for unknown plan", () => {
      const result = getPlanForTool("github-copilot", "ultra-mega");
      expect(result).toBeUndefined();
    });

    it("getToolsByCategory returns tools in category", () => {
      const assistants = getToolsByCategory("ai-assistant");
      expect(assistants.length).toBeGreaterThanOrEqual(2);
      for (const tool of assistants) {
        expect(tool.category).toBe("ai-assistant");
      }
    });

    it("getCategories returns unique categories", () => {
      const categories = getCategories();
      expect(categories.length).toBeGreaterThanOrEqual(3);
      const unique = new Set(categories);
      expect(unique.size).toBe(categories.length);
    });
  });
});
