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

## Future Architecture (Day 2+)

```
┌──────────────────────────────────────────────────┐
│                   Client (Next.js)                │
│                                                    │
│  Landing ──→ Audit Form ──→ Results ──→ Email     │
│                                    │    Capture    │
│                                    ▼               │
│                              PDF Export            │
│                              Share URL             │
└───────────────────┬──────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────┐
│               API Routes (Next.js)                │
│                                                    │
│  POST /api/audit    ──→ Engine + Save to DB       │
│  GET  /api/audit/:id ──→ Fetch result             │
│  POST /api/lead      ──→ Capture email            │
│  GET  /api/share/:id ──→ Public result page       │
└───────────────────┬──────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────┐
│                  Supabase                         │
│                                                    │
│  Tables:                                           │
│    audits        (id, input, result, created_at)   │
│    leads         (id, email, audit_id, created_at) │
│    shared_audits (id, audit_id, slug, og_image)    │
└──────────────────────────────────────────────────┘
```

## Security Considerations

- No secrets in client-side code
- Rate limiting on API routes (future)
- Input validation at every boundary (Zod)
- No raw SQL — Supabase SDK only
- Environment variables via `.env.local` (never committed)
