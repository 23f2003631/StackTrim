/**
 * Pricing Catalog Tests
 *
 * These tests verify the integrity of our pricing data.
 * This is the highest-risk area of the product — if catalog data
 * is malformed, every audit result is wrong.
 *
 * @version 2.0 — Day 2: added pricingModel, vendor, new tool coverage
 */

import { describe, it, expect } from "vitest";
import {
  pricingCatalog,
  getToolById,
  getPlanForTool,
  getToolsByCategory,
  getCategories,
  getCheapestPaidPlan,
  getAlternatives,
} from "@/lib/engine/catalog";

describe("Pricing Catalog", () => {
  describe("data integrity", () => {
    it("should contain at least 10 tools", () => {
      expect(pricingCatalog.tools.length).toBeGreaterThanOrEqual(10);
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

    it("every tool should have a pricingModel", () => {
      const validModels = ["per-seat", "usage-based", "flat-rate", "hybrid"];
      for (const tool of pricingCatalog.tools) {
        expect(validModels).toContain(tool.pricingModel);
      }
    });

    it("every tool should have a lastVerified date in valid ISO format", () => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      for (const tool of pricingCatalog.tools) {
        expect(tool.lastVerified).toMatch(dateRegex);
      }
    });

    it("every plan should have a non-empty name", () => {
      for (const tool of pricingCatalog.tools) {
        for (const plan of tool.plans) {
          expect(plan.name).toBeTruthy();
          expect(plan.name.length).toBeGreaterThan(0);
        }
      }
    });

    it("every plan should have at least one feature", () => {
      for (const tool of pricingCatalog.tools) {
        for (const plan of tool.plans) {
          expect(plan.features.length).toBeGreaterThanOrEqual(1);
        }
      }
    });

    it("alternatives should reference valid tool IDs", () => {
      const allIds = new Set(pricingCatalog.tools.map((t) => t.id));
      for (const tool of pricingCatalog.tools) {
        if (tool.alternatives) {
          for (const altId of tool.alternatives) {
            expect(allIds.has(altId)).toBe(true);
          }
        }
      }
    });

    it("tools with startup credits should have credit notes", () => {
      for (const tool of pricingCatalog.tools) {
        if (tool.hasStartupCredits) {
          expect(tool.creditNotes).toBeTruthy();
        }
      }
    });
  });

  describe("specific tool verification", () => {
    it("GitHub Copilot should have 4 plans", () => {
      const tool = getToolById("github-copilot");
      expect(tool).toBeDefined();
      expect(tool!.plans).toHaveLength(4);
      expect(tool!.plans[0].monthlyPricePerSeat).toBe(0);   // Free
      expect(tool!.plans[1].monthlyPricePerSeat).toBe(10);  // Pro
      expect(tool!.plans[2].monthlyPricePerSeat).toBe(19);  // Business
      expect(tool!.plans[3].monthlyPricePerSeat).toBe(39);  // Enterprise
    });

    it("Cursor should have 3 plans with correct pricing", () => {
      const tool = getToolById("cursor");
      expect(tool).toBeDefined();
      expect(tool!.plans).toHaveLength(3);
      expect(tool!.plans[1].monthlyPricePerSeat).toBe(20);  // Pro
      expect(tool!.plans[2].monthlyPricePerSeat).toBe(40);  // Business
    });

    it("OpenAI should have startup credits", () => {
      const tool = getToolById("openai-api");
      expect(tool).toBeDefined();
      expect(tool!.hasStartupCredits).toBe(true);
      expect(tool!.creditNotes).toContain("credit");
    });

    it("Google Gemini should be in the catalog", () => {
      const tool = getToolById("google-gemini");
      expect(tool).toBeDefined();
      expect(tool!.category).toBe("ai-api");
      expect(tool!.hasStartupCredits).toBe(true);
    });

    it("v0 by Vercel should be in the catalog", () => {
      const tool = getToolById("v0");
      expect(tool).toBeDefined();
      expect(tool!.category).toBe("ai-assistant");
      expect(tool!.vendor).toBe("Vercel");
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
      expect(assistants.length).toBeGreaterThanOrEqual(3);
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

    it("getCheapestPaidPlan returns correct plan", () => {
      const plan = getCheapestPaidPlan("github-copilot");
      expect(plan).toBeDefined();
      expect(plan!.id).toBe("pro");
      expect(plan!.monthlyPricePerSeat).toBe(10);
    });

    it("getCheapestPaidPlan returns undefined for unknown tool", () => {
      const plan = getCheapestPaidPlan("nonexistent");
      expect(plan).toBeUndefined();
    });

    it("getAlternatives returns valid tools", () => {
      const alternatives = getAlternatives("cursor");
      expect(alternatives.length).toBeGreaterThanOrEqual(1);
      for (const alt of alternatives) {
        expect(alt.category).toBe("ai-assistant");
      }
    });

    it("getAlternatives returns empty for tool without alternatives", () => {
      const alternatives = getAlternatives("nonexistent");
      expect(alternatives).toHaveLength(0);
    });
  });
});
