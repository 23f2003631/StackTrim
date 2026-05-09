# Development Log

## Day 1 — Foundation & Architecture

**Date:** 2026-05-07
**Focus:** Project scaffold, domain modeling, audit engine, landing page, testing

### What I built

1. **Project scaffold** — Next.js 16 App Router + TypeScript + Tailwind v4 + shadcn/ui
2. **Domain types** — `AuditInput`, `AuditResult`, `Recommendation`, `ToolCatalogEntry`
3. **Pricing catalog** — 10 real AI tools with verified pricing from public pages
4. **Audit engine** — Deterministic analyzer: rightsizing, downgrades, credit matching
5. **Landing page** — Hero, value props, trust signals, CTA
6. **Spend form** — React Hook Form + Zod, dynamic tool entries, catalog-driven selects
7. **Results UI** — Summary cards, recommendation cards, methodology disclaimer
8. **Testing** — Vitest setup, 15+ tests covering catalog integrity and engine logic
9. **CI** — GitHub Actions: lint → typecheck → test → build
10. **Documentation** — All 12 root markdown files structured

### Key decisions

- **Client-side engine first**: No API needed for Day 1. The engine is pure functions — same code runs server-side later when we add Supabase.
- **Conservative savings**: Only flag downgrades when savings exceed 15% of current cost. We'd rather miss a small optimization than make a bad recommendation.
- **Real pricing data**: Not approximations. Every price has a public URL source and a verification date.
- **No auth**: Deliberately omitted. The product delivers value before asking anything.

### What I deferred

- Supabase integration (needs schema design)
- Email capture (comes after value delivery)
- PDF export
- AI summary
- Public share URLs
- Framer Motion animations

### Time spent

~3 hours of focused execution.

## Day 2 — Audit Engine Foundation

**Date:** 2026-05-07
**Focus:** Pure calculation utilities, confidence scoring, overlap detection, PII sanitization

### What I built

1. **Calculations Library** — Extracted all math into pure, deterministic functions (`calculations.ts`)
2. **Confidence Scoring** — Objective factor-based system for high/medium/low trust signals (`confidence.ts`)
3. **Enhanced Analyzer** — Added consolidation logic (overlap detection) and "Keep" recommendations (`analyzer.ts`)
4. **Public Snapshot** — Built PII sanitization layer to prepare for shareable URLs (`snapshot.ts`)
5. **Catalog Expansion** — Added pricingModel, vendor, Google Gemini, and v0 by Vercel
6. **Results UI** — Added formula breakdowns, confidence badges, and overlap alerts
7. **Comprehensive Testing** — Scaled from 23 to 126 tests covering all engine logic

### Key decisions

- **Math transparency**: Every recommendation now includes a readable `formula` string.
- **Conservative consolidation**: We assume the cheapest tool is dropped when consolidating overlapping tools.
- **Factor-based confidence**: Instead of hardcoding confidence, we derive it from factors like pricing freshness and usage assumptions.

### Time spent

~2 hours.

---

## Day 3 — Backend Persistence & SaaS Execution

**Focus:** Supabase integration, Server/Client Boundaries, Premium UX

### What I built
1. **Supabase Integration**: Implemented strict Option A architecture using `SUPABASE_SERVICE_ROLE_KEY` exclusively on the server.
2. **Server-Side Determinism**: `POST /api/audit` runs the engine on the server to prevent client-side manipulation.
3. **Public Snapshots**: Developed `/share/[slug]` pages using `nanoid` slugs, ensuring privacy for full audit results.
4. **Premium UX**: High-end visual upgrades including an Honest Empty State for zero-savings results.

---

## Day 4 — Lead Generation & Transactional Email

**Focus:** GenAI Summaries, Lead Capture, Resend Transactional Emails, Abuse Protection

### What I built
1. **AI Operations Summary**: Integrated `@google/genai` inside `/api/audit/[slug]/summary` with a resilient 4s `AbortController` and deterministic fallback text.
2. **Post-Value Lead Capture**: Developed a premium "Discuss these savings" CTA that securely saves to the `leads` table.
3. **Transactional Emails**: Integrated `resend` to trigger beautifully formatted, minimalist HTML emails (`src/lib/email/templates/audit-report.ts`) containing the AI summary and full savings breakdown.
4. **Graceful Degradation Boundaries**: Ensured `POST /api/lead` successfully records leads even if the email dispatch fails, returning a clean 201 response.
5. **Abuse Protection**: Implemented lightweight IP rate limiting and honeypot structures.

---

*Entries will be added daily as development continues.*
