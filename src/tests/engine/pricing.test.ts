import { describe, it, expect } from "vitest";
import { 
  getPlanPrice, 
  computeExpectedSpend, 
  computeDeviation, 
  classifyMismatchSeverity,
  capSavingsPotential
} from "@/lib/engine/pricing";

describe("Pricing Engine Basics", () => {
  it("should retrieve plan price from catalog", () => {
    // GitHub Copilot Enterprise is $39
    expect(getPlanPrice("github-copilot", "enterprise")).toBe(39);
    // Non-existent tool/plan should be 0 (default)
    expect(getPlanPrice("fake-tool", "tier")).toBe(0);
  });

  it("should compute expected spend correctly", () => {
    expect(computeExpectedSpend(39, 10)).toBe(390);
    expect(computeExpectedSpend(0, 50)).toBe(0);
  });

  it("should compute deviation percentage", () => {
    // $45 vs $39 is ~15% deviation
    expect(computeDeviation(45, 39)).toBeCloseTo(0.1538, 4);
    // Exact match is 0
    expect(computeDeviation(100, 100)).toBe(0);
    // Lower spend is 0.2 deviation (absolute)
    expect(computeDeviation(80, 100)).toBe(0.2);
  });
});

describe("Mismatch Severity Classification", () => {
  it("should classify none for exact matches", () => {
    expect(classifyMismatchSeverity(0)).toBe("none");
    expect(classifyMismatchSeverity(0.05)).toBe("none");
  });

  it("should classify low for 10-20% deviation", () => {
    expect(classifyMismatchSeverity(0.15)).toBe("low");
  });

  it("should classify medium for 20-50% deviation", () => {
    expect(classifyMismatchSeverity(0.35)).toBe("medium");
  });

  it("should classify high for 50-150% deviation", () => {
    expect(classifyMismatchSeverity(1.2)).toBe("high");
  });

  it("should classify extreme for >150% deviation", () => {
    expect(classifyMismatchSeverity(2.5)).toBe("extreme");
  });
});

describe("Bounded Optimization (capSavingsPotential)", () => {
  it("should return full theoretical savings when deviation is low", () => {
    // Current: $390 ($39 * 10 seats)
    // Optimized: $195 ($39 * 5 seats)
    // Savings: $195
    // Deviation: 0 (low)
    expect(capSavingsPotential(390, 390, 195, "none")).toBe(195);
  });

  it("should cap savings when mismatch is high", () => {
    // User claims $1000 spend on a $39 plan (expected $390)
    // Severity: Extreme
    // Expected optimized: $195
    // Naive savings would be $1000 - $195 = $805
    // Bounded savings should be much lower (capping at expected spend)
    const savings = capSavingsPotential(1000, 390, 195, "extreme");
    expect(savings).toBeLessThan(805);
    expect(savings).toBe(390); // Cap of 2x catalog theoretical savings (195 * 2)
  });

  it("should blend savings for medium mismatches", () => {
    // Medium mismatch
    const savings = capSavingsPotential(500, 390, 195, "medium");
    // Should be between catalog savings (195) and naive savings (305)
    expect(savings).toBeGreaterThan(195);
    expect(savings).toBeLessThan(305);
  });
});
