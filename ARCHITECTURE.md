# Architecture

## System Overview

StackTrim is a lead-generation audit platform. It delivers immediate value (savings analysis) before asking anything from the user (email, signup). The architecture prioritizes:

1. **Determinism** — Financial logic is never AI-generated
2. **Testability** — The audit engine is pure functions with no side effects
3. **Deployability** — Always shippable, no broken states
4. **Simplicity** — No premature abstractions

## Data Flow

```
User Input (Form)
    │
    ▼
Zod Validation (src/lib/validations/)
    │
    ▼
Audit Engine (src/lib/engine/analyzer.ts)
    │   ├── Pricing Catalog (src/lib/engine/catalog.ts)
    │   ├── Calculation Layer (src/lib/engine/calculations.ts) [New Day 2]
    │   ├── Confidence Scoring (src/lib/engine/confidence.ts) [New Day 2]
    │   ├── Applies: Rightsizing, Downgrades, Credits
    │   └── Applies: Cross-tool Overlaps & Consolidations [New Day 2]
    │
    ▼
Audit Result (typed, deterministic)
    │
    ▼
Results UI (src/components/audit/audit-results.tsx)
```

## Key Design Decisions

### Why deterministic over AI-generated recommendations?

Trust. Our ICP (startup CTOs, eng managers) will not act on financial advice from a hallucination-prone model. Every number must be traceable to a catalog entry with a public pricing URL and a verification date.

### Why client-side analysis (Day 1)?

Speed. The audit engine is pure TypeScript — no API call needed, no loading spinner while waiting for a server. For Day 1, this is the right tradeoff. When we add Supabase persistence, the engine runs identically server-side.

### Why shadcn/ui over custom components?

Velocity without vendor lock-in. shadcn/ui gives us owned, accessible, type-safe components that we can customize. We copy the source, not install a dependency.

### Why Geist font?

Geist is Vercel's font — it signals "modern SaaS" to our target audience. It's the default in Next.js 16, so zero additional cost.

## Current Architecture (Day 5)

```
┌────────────────────────────────────────────────────────┐
│                   Client (Next.js)                     │
│                                                         │
│  Landing ──→ Audit Form ──→ Results ──→ Lead Capture    │
│                                    │    (Consultation)  │
│                                    ├──→ Print/PDF       │
│                                    ▼                    │
│                              Public Share URL           │
│                              (+ Dynamic OG Image)       │
└───────────────────┬───────────────────────────────┬────┘
                    │                               │
                    ▼                               ▼
┌───────────────────────────────────────┐   ┌───────────────────────────┐
│          API Routes (Next.js)         │   │   External Providers      │
│                                       │   │                           │
│  POST /api/audit    ──→ Engine/DB     │   │  Gemini AI (Summaries)    │
│  GET  /api/audit/:id/summary ──→ AI   ├───┼──→                        │
│  POST /api/lead      ──→ DB/Email     │   │  Resend (Transactional)   │
│                                       │   │                           │
│  Static Routes:                       │   │                           │
│  /share/:slug        ──→ Public View  │   │                           │
│  /share/:slug/print  ──→ PDF Layout   │   │                           │
│  /share/:slug/og     ──→ OG Image     │   │                           │
└───────────────────┬───────────────────┘   └───────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────┐
│                  Supabase (PostgreSQL)                 │
│                                                         │
│  Tables:                                                │
│    audits (id, slug, input, result, public_snapshot)    │
│    leads  (id, email, audit_id, created_at)             │
│    events (id, event_type, audit_id, data)              │
│                                                         │
│  Security: Strict RLS (Default Deny), Server-Side only  │
└────────────────────────────────────────────────────────┘
```

## Security & Reliability Boundaries

- **No client-side secrets**: All Supabase, Gemini, and Resend keys stay on the server.
- **Strict Rate Limiting**: In-memory IP rate limiting and honeypot validation on `/api/audit` and `/api/lead`.
- **Async Safety**: High-latency actions (AI summary generation, transactional email dispatch) are isolated. AI uses a 4s `AbortController` timeout to prevent blocking. Lead capture records to the database *before* firing transactional emails to prevent data loss.

## Security Considerations

- No secrets in client-side code
- Rate limiting on all POST API routes (in-memory IP tracking)
- Honeypot fields on lead capture to silently reject bots
- Input validation at every boundary (Zod schemas)
- No raw SQL — Supabase SDK only
- Environment variables via `.env.local` (never committed)
- Public snapshot sanitization strips all PII before DB persistence
- **Secure Telemetry**: All client analytics events route through the server `/api/events` instead of pinging Supabase directly, preventing client credential exposure.

## Observability & Configuration

- **`logger.ts`**: Provides structured, tiered logging (`info`, `warn`, `error`, `metric`) decoupled from raw `console.log`. Safe for server components.
- **`flags.ts`**: Centralized configuration management to toggle feature sets like `enableBenchmarks` or `enableTopOpportunities` at runtime.

## Async Rendering Strategy

```
┌──────────────────────────────────────────────────────┐
│  /share/[slug]  (Server Component — SSR)             │
│                                                       │
│  1. Server fetches public_snapshot from Supabase      │
│  2. Deterministic content renders immediately         │
│  3. Page HTML streams to client                       │
│                                                       │
│  ┌────────────────────────────────────────────────┐   │
│  │  <AuditResults>  (Client Component)            │   │
│  │                                                │   │
│  │  4. useEffect fires on mount                   │   │
│  │  5. GET /api/audit/[slug]/summary              │   │
│  │     └─ 8s AbortController timeout (client)     │   │
│  │     └─ 4s AbortController timeout (server/AI)  │   │
│  │     └─ Deterministic fallback on any failure   │   │
│  │  6. Summary fades in with skeleton → content   │   │
│  │                                                │   │
│  │  Key: Deterministic results are NEVER blocked  │   │
│  │  by AI summary loading.                        │   │
│  └────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

## OG Image Rendering Flow

1. Social platform requests `/share/[slug]/opengraph-image`
2. Next.js routes to `opengraph-image.tsx` (runtime: nodejs)
3. Server fetches `public_snapshot` from Supabase via admin client
4. `ImageResponse` renders dark-themed card with Satori engine:
   - Dominant annual savings number
   - Savings percentage + tool count
   - Catalog version in footer
   - StackTrim branding (minimal)
5. Returns `image/png` at 1200×630

## PDF Architecture

- **Route**: `/share/[slug]/print` — dedicated, isolated from main share page
- **Data flow**: Server component fetches `public_snapshot`, `metadata.aiSummary`, `created_at`
- **Rendering**: `PrintAuditView` is a `"use client"` component (required for `useEffect` auto-print)
- **Print trigger**: `window.print()` fires after 600ms layout delay
- **Includes**: Timestamp, catalog version, engine version, methodology disclosure, report link

## Error Boundaries & Graceful Degradation

- **Global Handling**: `error.tsx` provides a calm, premium fallback UI for uncaught server/client exceptions without exposing stack traces to end users.
- **Not Found**: `not-found.tsx` guarantees a polished 404 experience with clear navigation back to the audit creation flow.
- **Fail-Open External Boundaries**: Gemini timeouts and quota limits are safely caught and tracked, immediately serving deterministic fallback logic without ever returning a 500 status to the client.
- **Future path**: Architecture supports migration to server-side Puppeteer PDF if needed

## Fallback Systems

| Provider | Timeout | Fallback | Impact |
|----------|---------|----------|--------|
| **Gemini AI** | 4s (server) | Deterministic summary text | Summary is formulaic but accurate |
| **Gemini AI** | 8s (client fetch) | Summary section stays hidden | Results remain fully usable |
| **Resend Email** | N/A | Lead saved to DB regardless | Business value preserved |
| **Supabase** | Default | 404/500 page | Critical — no fallback |
| **Missing API keys** | N/A | Clean console warning + fallback | Tests verify this path |
