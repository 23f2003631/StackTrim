/**
 * Lightweight feature flag and configuration system.
 * Allows safely toggling features for production/development.
 */

export const flags = {
  /**
   * If true, displays benchmark comparison data in the audit results.
   */
  enableBenchmarks: true,

  /**
   * If true, highlights the top optimization opportunity explicitly.
   */
  enableTopOpportunities: true,

  /**
   * The current AI provider to use for summaries.
   */
  aiProvider: "gemini" as "gemini" | "openai" | "anthropic",

  /**
   * High savings threshold ($/mo) before showing the consultation CTA.
   */
  consultationCtaThreshold: 500,

  /**
   * Whether the internal dashboard is enabled.
   */
  enableInternalDashboard: true,
} as const;

export type FeatureFlags = typeof flags;
