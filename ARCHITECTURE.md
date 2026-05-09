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

## Current Architecture (Day 4)

```
┌────────────────────────────────────────────────────────┐
│                   Client (Next.js)                     │
│                                                         │
│  Landing ──→ Audit Form ──→ Results ──→ Lead Capture    │
│                                    │    (Consultation)  │
│                                    ▼                    │
│                              Public Share URL           │
└───────────────────┬───────────────────────────────┬────┘
                    │                               │
                    ▼                               ▼
┌───────────────────────────────────────┐   ┌───────────────────────────┐
│          API Routes (Next.js)         │   │   External Providers      │
│                                       │   │                           │
│  POST /api/audit    ──→ Engine/DB     │   │  Gemini AI (Summaries)    │
│  GET  /api/audit/:id/summary ──→ AI   ├───┼──→                        │
│  POST /api/lead      ──→ DB/Email     │   │  Resend (Transactional)   │
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
- Rate limiting on API routes (future)
- Input validation at every boundary (Zod)
- No raw SQL — Supabase SDK only
- Environment variables via `.env.local` (never committed)
