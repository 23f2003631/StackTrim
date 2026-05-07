# Pricing Data

## Sourcing Methodology

All pricing data in StackTrim's catalog (`src/lib/engine/catalog.ts`) is sourced from **publicly available pricing pages**. No pricing data is estimated, interpolated, or AI-generated.

### Verification Process

1. Visit the vendor's official pricing page
2. Record per-seat monthly pricing for each tier
3. Note key features and limits per tier
4. Record the verification date
5. Store the pricing URL for transparency

### Data Fields Per Tool

| Field | Description |
|-------|-------------|
| `id` | Unique kebab-case identifier |
| `name` | Display name |
| `vendor` | Name of the vendor company (added Day 2) |
| `category` | Tool category |
| `pricingModel` | How it's priced: per-seat, usage-based, flat-rate, hybrid (added Day 2) |
| `pricingUrl` | Source URL for verification |
| `lastVerified` | Date pricing was checked |
| `plans[]` | Array of plan tiers with pricing |
| `alternatives` | IDs of similar tools |
| `hasStartupCredits` | Whether vendor offers credits |

## Current Catalog (v2026.05.2)

| Tool | Category | Model | Plans | Last Verified |
|------|----------|-------|-------|---------------|
| GitHub Copilot | AI Assistant | per-seat | Free, Pro ($10), Business ($19), Enterprise ($39) | 2026-05-01 |
| Cursor | AI Assistant | per-seat | Hobby (Free), Pro ($20), Business ($40) | 2026-05-01 |
| Codeium / Windsurf | AI Assistant | per-seat | Free, Pro ($15), Teams ($30) | 2026-05-01 |
| v0 by Vercel | AI Assistant | per-seat | Free, Premium ($20) | 2026-05-01 |
| OpenAI API | AI API | hybrid | PAYG, Plus ($20), Team ($25), Enterprise ($60) | 2026-05-01 |
| Anthropic (Claude) | AI API | hybrid | PAYG, Pro ($20), Team ($25), Enterprise ($60) | 2026-05-01 |
| Google Gemini | AI API | hybrid | Free, Advanced ($20), Workspace AI ($30) | 2026-05-01 |
| Vercel | Cloud Infra | per-seat | Hobby (Free), Pro ($20), Enterprise ($50) | 2026-05-01 |
| Hugging Face | AI Platform | per-seat | Free, Pro ($9), Enterprise ($20) | 2026-05-01 |
| Replicate | AI Platform | usage-based | PAYG | 2026-05-01 |
| Notion AI | Productivity | per-seat | Free, Plus ($12), Business ($18) | 2026-05-01 |
| Grammarly | Productivity | per-seat | Free, Premium ($12), Business ($15) | 2026-05-01 |

## Staleness Risk

Pricing data goes stale. Our mitigation:
- `lastVerified` field on every entry — users can see when data was checked
- Methodology disclaimer on every audit result
- Catalog version tracking for cache invalidation
- Future: automated price monitoring (stretch goal)

## Expansion Plan

Priority additions for Day 2+:
- AWS Bedrock / SageMaker
- Google Cloud AI/Vertex
- Datadog
- Snowflake
- Figma (with AI features)
- Linear
- Slack (with AI add-on)
