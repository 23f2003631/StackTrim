/**
 * Pricing catalog types.
 *
 * The catalog is the single source of truth for all tool pricing.
 * Every savings calculation references catalog data, never user input alone.
 * Prices are sourced from public pricing pages with date stamps.
 *
 * @module types/catalog
 * @version 2.0 — Day 2 expansion with pricing model support
 */

// ---------------------------------------------------------------------------
// Tool Category
// ---------------------------------------------------------------------------

/** Categories of AI/dev tools */
export type ToolCategory =
  | "ai-assistant"     // Copilot, Cursor, Codeium
  | "ai-api"           // OpenAI, Anthropic, Cohere
  | "ai-platform"      // Hugging Face, Replicate
  | "cloud-infra"      // Vercel, AWS, GCP
  | "data"             // Snowflake, Databricks
  | "monitoring"       // Datadog, New Relic
  | "productivity"     // Notion AI, Grammarly
  | "design"           // Figma AI, Midjourney
  | "other";

// ---------------------------------------------------------------------------
// Pricing Model
// ---------------------------------------------------------------------------

/** How the tool charges — seat-based or usage-based */
export type PricingModel = "per-seat" | "usage-based" | "flat-rate" | "hybrid";

// ---------------------------------------------------------------------------
// Plan & Pricing
// ---------------------------------------------------------------------------

/** A single plan tier for a tool */
export interface PlanTier {
  /** Plan identifier (e.g., "free", "pro", "team", "enterprise") */
  id: string;
  /** Human-readable plan name */
  name: string;
  /** Monthly price per seat in USD */
  monthlyPricePerSeat: number;
  /** Key features included in this tier */
  features: string[];
  /** Usage limits (e.g., { "api_calls": 1000, "tokens": 100000 }) */
  limits?: Record<string, number>;
  /** Whether this is the recommended plan for most teams */
  recommended?: boolean;
  /** Whether this plan requires contacting sales (price may be negotiable) */
  requiresSalesContact?: boolean;
  /** Minimum seats required for this plan (e.g., enterprise = 25+) */
  minSeats?: number;
}

/** A complete catalog entry for one tool */
export interface ToolCatalogEntry {
  /** Unique tool identifier (kebab-case) */
  id: string;
  /** Display name */
  name: string;
  /** Tool category */
  category: ToolCategory;
  /** How pricing works for this tool */
  pricingModel: PricingModel;
  /** URL of the tool's pricing page (for transparency) */
  pricingUrl: string;
  /** When this pricing data was last verified (ISO 8601 date) */
  lastVerified: string;
  /** Available plan tiers, ordered from cheapest to most expensive */
  plans: PlanTier[];
  /** IDs of tools that can serve as alternatives (same category) */
  alternatives?: string[];
  /** Whether the tool offers startup credits */
  hasStartupCredits?: boolean;
  /** Notes about the tool's credit program */
  creditNotes?: string;
  /** Vendor company name (for grouping same-vendor tools) */
  vendor?: string;
}

/** The complete pricing catalog */
export interface PricingCatalog {
  /** Catalog version for cache invalidation */
  version: string;
  /** When the catalog was last updated (ISO 8601 date) */
  lastUpdated: string;
  /** All tool entries */
  tools: ToolCatalogEntry[];
}
