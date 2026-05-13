export const flags = {
  enableBenchmarks: true,
  enableTopOpportunities: true,
  aiProvider: "gemini" as "gemini" | "openai" | "anthropic",
  consultationCtaThreshold: 500,
  enableInternalDashboard: true,
} as const;

export type FeatureFlags = typeof flags;
