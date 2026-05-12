import { describe, it, expect } from "vitest";
import { 
  classifySavingsRealism, 
  calculateOptimizableSeats, 
  isFreeTierRealistic 
} from "@/lib/engine/realism";

describe("Savings Realism Engine", () => {
  describe("classifySavingsRealism", () => {
    it("should classify low savings as normal", () => {
      expect(classifySavingsRealism(10)).toBe("normal");
      expect(classifySavingsRealism(15)).toBe("normal");
    });

    it("should classify moderate savings as aggressive", () => {
      expect(classifySavingsRealism(20)).toBe("aggressive");
      expect(classifySavingsRealism(35)).toBe("aggressive");
    });

    it("should classify high savings as extreme", () => {
      expect(classifySavingsRealism(40)).toBe("extreme");
      expect(classifySavingsRealism(75)).toBe("extreme");
    });
  });

  describe("calculateOptimizableSeats", () => {
    it("should return same seats if no excess", () => {
      expect(calculateOptimizableSeats(10, 10)).toBe(10);
      expect(calculateOptimizableSeats(5, 10)).toBe(5);
    });

    it("should conservatively reduce excess seats", () => {
      // 20 seats, 10 team size -> 10 excess.
      // reductionRatio (normal) is 0.7 -> 7 seats removed.
      // Result: 20 - 7 = 13.
      expect(calculateOptimizableSeats(20, 10)).toBe(13);
    });

    it("should be more conservative in extreme cases", () => {
      // 20 seats, 10 team size -> 10 excess.
      // reductionRatio (extreme) is 0.4 -> 4 seats removed.
      // Result: 20 - 4 = 16.
      expect(calculateOptimizableSeats(20, 10, true)).toBe(16);
    });
  });

  describe("isFreeTierRealistic", () => {
    it("should be realistic for small teams", () => {
      expect(isFreeTierRealistic(3, "slack")).toBe(true);
      expect(isFreeTierRealistic(5, "github")).toBe(true);
    });

    it("should be unrealistic for large teams on critical tools", () => {
      expect(isFreeTierRealistic(15, "slack")).toBe(false);
      expect(isFreeTierRealistic(15, "linear")).toBe(false);
    });

    it("should allow free tier for very large teams on non-critical tools (hypothetically)", () => {
      // This might change if we add more tool-specific logic
      expect(isFreeTierRealistic(8, "some-random-tool")).toBe(true);
    });
  });
});
