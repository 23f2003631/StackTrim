/**
 * Application constants.
 * Centralized config values used across the app.
 */

export const APP_NAME = "StackTrim";
export const APP_TAGLINE = "Find wasted AI spend before your next invoice.";
export const APP_DESCRIPTION =
  "StackTrim audits your AI tool subscriptions and finds savings opportunities. No signup required. Results in 60 seconds.";
export const APP_URL = "https://stacktrim.dev";

/** Maximum number of tools a user can add in one audit */
export const MAX_TOOLS_PER_AUDIT = 20;

/** Minimum team size */
export const MIN_TEAM_SIZE = 1;

/** Maximum team size we support analysis for */
export const MAX_TEAM_SIZE = 500;

/** Catalog version — bump when pricing data changes */
export const CATALOG_VERSION = "2026.05.1";

/** Trust signals shown on the landing page */
export const TRUST_SIGNALS = [
  {
    title: "No signup required",
    description: "Get your audit results immediately. We ask for email only after you see value.",
  },
  {
    title: "Results in 60 seconds",
    description: "Enter your tools, get actionable savings. No onboarding, no sales calls.",
  },
  {
    title: "100% deterministic",
    description: "Every recommendation is backed by real pricing data. No AI hallucinations.",
  },
] as const;
