import { describe, it, expect } from "vitest";
import { flags } from "@/lib/config/flags";

describe("Feature Flags", () => {
  it("should have expected flags defined", () => {
    expect(flags.enableBenchmarks).toBeDefined();
    expect(flags.enableTopOpportunities).toBeDefined();
    expect(flags.aiProvider).toBe("gemini");
    expect(flags.consultationCtaThreshold).toBeGreaterThan(0);
    expect(flags.enableInternalDashboard).toBeDefined();
  });
});
