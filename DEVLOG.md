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

---

*Entries will be added daily as development continues.*
