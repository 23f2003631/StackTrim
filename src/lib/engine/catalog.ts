/**
 * Pricing Catalog — Real AI tool pricing data.
 *
 * IMPORTANT: All prices sourced from public pricing pages.
 * Last verified: May 2026.
 * See PRICING_DATA.md for sourcing methodology.
 *
 * This is the ONLY source of truth for pricing in the audit engine.
 * AI never decides prices. Prices are deterministic lookups.
 */

import type { ToolCatalogEntry, PricingCatalog } from "@/lib/types/catalog";

const tools: ToolCatalogEntry[] = [
  // -------------------------------------------------------------------------
  // AI Coding Assistants
  // -------------------------------------------------------------------------
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    category: "ai-assistant",
    pricingUrl: "https://github.com/features/copilot#pricing",
    lastVerified: "2026-05-01",
    plans: [
      {
        id: "free",
        name: "Free",
        monthlyPricePerSeat: 0,
        features: ["2000 code completions/month", "50 chat messages/month"],
        limits: { completions: 2000, chat_messages: 50 },
      },
      {
        id: "pro",
        name: "Pro",
        monthlyPricePerSeat: 10,
        features: ["Unlimited completions", "Unlimited chat", "CLI access"],
        recommended: true,
      },
      {
        id: "business",
        name: "Business",
        monthlyPricePerSeat: 19,
        features: ["Organization management", "Policy controls", "Audit logs", "IP indemnity"],
      },
      {
        id: "enterprise",
        name: "Enterprise",
        monthlyPricePerSeat: 39,
        features: ["Everything in Business", "Fine-tuned models", "Knowledge bases"],
      },
    ],
    alternatives: ["cursor", "codeium"],
  },
  {
    id: "cursor",
    name: "Cursor",
    category: "ai-assistant",
    pricingUrl: "https://cursor.com/pricing",
    lastVerified: "2026-05-01",
    plans: [
      {
        id: "free",
        name: "Hobby",
        monthlyPricePerSeat: 0,
        features: ["2000 completions", "50 slow premium requests"],
        limits: { completions: 2000, premium_requests: 50 },
      },
      {
        id: "pro",
        name: "Pro",
        monthlyPricePerSeat: 20,
        features: ["Unlimited completions", "500 fast premium requests", "Unlimited slow"],
        limits: { fast_premium_requests: 500 },
        recommended: true,
      },
      {
        id: "business",
        name: "Business",
        monthlyPricePerSeat: 40,
        features: ["Everything in Pro", "Admin dashboard", "SAML SSO", "Usage analytics"],
      },
    ],
    alternatives: ["github-copilot", "codeium"],
  },
  {
    id: "codeium",
    name: "Codeium / Windsurf",
    category: "ai-assistant",
    pricingUrl: "https://codeium.com/pricing",
    lastVerified: "2026-05-01",
    plans: [
      {
        id: "free",
        name: "Free",
        monthlyPricePerSeat: 0,
        features: ["Unlimited autocomplete", "Limited chat", "Limited commands"],
      },
      {
        id: "pro",
        name: "Pro",
        monthlyPricePerSeat: 15,
        features: ["Unlimited everything", "Personalization", "Advanced models"],
        recommended: true,
      },
      {
        id: "business",
        name: "Teams",
        monthlyPricePerSeat: 30,
        features: ["Everything in Pro", "Admin controls", "SSO", "Usage analytics"],
      },
    ],
    alternatives: ["github-copilot", "cursor"],
  },

  // -------------------------------------------------------------------------
  // AI API Providers
  // -------------------------------------------------------------------------
  {
    id: "openai-api",
    name: "OpenAI API",
    category: "ai-api",
    pricingUrl: "https://openai.com/pricing",
    lastVerified: "2026-05-01",
    hasStartupCredits: true,
    creditNotes: "OpenAI Startup Program: up to $25K in credits for qualifying startups.",
    plans: [
      {
        id: "payg",
        name: "Pay As You Go",
        monthlyPricePerSeat: 0,
        features: ["Usage-based pricing", "All models", "Rate limits apply"],
      },
      {
        id: "plus",
        name: "ChatGPT Plus",
        monthlyPricePerSeat: 20,
        features: ["GPT-4o access", "Advanced tools", "DALL·E", "Priority access"],
      },
      {
        id: "team",
        name: "ChatGPT Team",
        monthlyPricePerSeat: 25,
        features: ["Everything in Plus", "Workspace management", "Admin controls"],
      },
      {
        id: "enterprise",
        name: "ChatGPT Enterprise",
        monthlyPricePerSeat: 60,
        features: ["Unlimited GPT-4o", "Admin console", "SSO", "Data privacy"],
      },
    ],
    alternatives: ["anthropic-api"],
  },
  {
    id: "anthropic-api",
    name: "Anthropic (Claude)",
    category: "ai-api",
    pricingUrl: "https://anthropic.com/pricing",
    lastVerified: "2026-05-01",
    hasStartupCredits: true,
    creditNotes: "Anthropic offers startup credits through select accelerator partnerships.",
    plans: [
      {
        id: "payg",
        name: "API Pay As You Go",
        monthlyPricePerSeat: 0,
        features: ["Usage-based pricing", "Claude 3.5 Sonnet", "Claude 3 Opus"],
      },
      {
        id: "pro",
        name: "Claude Pro",
        monthlyPricePerSeat: 20,
        features: ["5x more usage", "Priority access", "Early feature access"],
      },
      {
        id: "team",
        name: "Claude Team",
        monthlyPricePerSeat: 25,
        features: ["Everything in Pro", "Team management", "Higher limits"],
      },
      {
        id: "enterprise",
        name: "Claude Enterprise",
        monthlyPricePerSeat: 60,
        features: ["Unlimited usage", "SSO", "Audit logs", "Custom retention"],
      },
    ],
    alternatives: ["openai-api"],
  },

  // -------------------------------------------------------------------------
  // Cloud / Deployment
  // -------------------------------------------------------------------------
  {
    id: "vercel",
    name: "Vercel",
    category: "cloud-infra",
    pricingUrl: "https://vercel.com/pricing",
    lastVerified: "2026-05-01",
    plans: [
      {
        id: "hobby",
        name: "Hobby",
        monthlyPricePerSeat: 0,
        features: ["Personal projects", "100GB bandwidth", "Serverless functions"],
        limits: { bandwidth_gb: 100 },
      },
      {
        id: "pro",
        name: "Pro",
        monthlyPricePerSeat: 20,
        features: ["Team collaboration", "1TB bandwidth", "Preview deployments"],
        limits: { bandwidth_gb: 1000 },
        recommended: true,
      },
      {
        id: "enterprise",
        name: "Enterprise",
        monthlyPricePerSeat: 50,
        features: ["SLA", "Advanced security", "Priority support", "Custom limits"],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // AI Platforms
  // -------------------------------------------------------------------------
  {
    id: "huggingface",
    name: "Hugging Face",
    category: "ai-platform",
    pricingUrl: "https://huggingface.co/pricing",
    lastVerified: "2026-05-01",
    plans: [
      {
        id: "free",
        name: "Free",
        monthlyPricePerSeat: 0,
        features: ["Public models", "Community inference", "Basic Spaces"],
      },
      {
        id: "pro",
        name: "Pro",
        monthlyPricePerSeat: 9,
        features: ["Private models", "Inference API", "ZeroGPU Spaces"],
        recommended: true,
      },
      {
        id: "enterprise",
        name: "Enterprise Hub",
        monthlyPricePerSeat: 20,
        features: ["SSO", "Audit logs", "Advanced compute", "Resource groups"],
      },
    ],
  },
  {
    id: "replicate",
    name: "Replicate",
    category: "ai-platform",
    pricingUrl: "https://replicate.com/pricing",
    lastVerified: "2026-05-01",
    plans: [
      {
        id: "payg",
        name: "Pay As You Go",
        monthlyPricePerSeat: 0,
        features: ["Usage-based", "All public models", "API access"],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Productivity / AI Tools
  // -------------------------------------------------------------------------
  {
    id: "notion-ai",
    name: "Notion AI",
    category: "productivity",
    pricingUrl: "https://notion.so/pricing",
    lastVerified: "2026-05-01",
    plans: [
      {
        id: "free",
        name: "Free",
        monthlyPricePerSeat: 0,
        features: ["Basic blocks", "10 guest collaborators"],
      },
      {
        id: "plus",
        name: "Plus",
        monthlyPricePerSeat: 12,
        features: ["Unlimited blocks", "Unlimited uploads", "30-day history"],
      },
      {
        id: "business",
        name: "Business",
        monthlyPricePerSeat: 18,
        features: ["Everything in Plus", "SAML SSO", "Advanced permissions"],
      },
    ],
    alternatives: [],
  },
  {
    id: "grammarly",
    name: "Grammarly",
    category: "productivity",
    pricingUrl: "https://grammarly.com/plans",
    lastVerified: "2026-05-01",
    plans: [
      {
        id: "free",
        name: "Free",
        monthlyPricePerSeat: 0,
        features: ["Basic grammar", "Spelling", "Punctuation"],
      },
      {
        id: "premium",
        name: "Premium",
        monthlyPricePerSeat: 12,
        features: ["Full AI writing", "Tone detection", "Plagiarism detection"],
      },
      {
        id: "business",
        name: "Business",
        monthlyPricePerSeat: 15,
        features: ["Everything in Premium", "Brand tones", "Admin panel", "Analytics"],
      },
    ],
  },
];

/** The complete pricing catalog */
export const pricingCatalog: PricingCatalog = {
  version: "2026.05.1",
  lastUpdated: "2026-05-01",
  tools,
};

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Find a tool by ID */
export function getToolById(toolId: string): ToolCatalogEntry | undefined {
  return pricingCatalog.tools.find((t) => t.id === toolId);
}

/** Find a plan tier for a tool */
export function getPlanForTool(
  toolId: string,
  planId: string
): { tool: ToolCatalogEntry; plan: (typeof tools)[number]["plans"][number] } | undefined {
  const tool = getToolById(toolId);
  if (!tool) return undefined;
  const plan = tool.plans.find((p) => p.id === planId);
  if (!plan) return undefined;
  return { tool, plan };
}

/** Get all tools in a category */
export function getToolsByCategory(category: string): ToolCatalogEntry[] {
  return pricingCatalog.tools.filter((t) => t.category === category);
}

/** Get all unique categories */
export function getCategories(): string[] {
  return [...new Set(pricingCatalog.tools.map((t) => t.category))];
}
