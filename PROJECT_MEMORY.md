# PROJECT_MEMORY.md — StackTrim Engineering Memory

> **Purpose:** Long-term engineering memory, implementation ledger, and context restoration system for AI-assisted development sessions. Future Day-3+ prompts depend on this file.

---

## Project Identity

| Field | Value |
|-------|-------|
| Product | StackTrim |
| Positioning | "Find wasted AI spend before your next invoice." |
| Category | B2B SaaS AI spend audit platform |
| Repo | `e:\Credex` |
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Testing | Vitest 4 |
| CI | GitHub Actions (lint → typecheck → test → build) |

---

## Architecture Overview

```
src/
├── app/                    → Next.js App Router pages
│   ├── page.tsx            → Landing page
│   ├── audit/page.tsx      → Audit form page
│   ├── layout.tsx          → Root layout (Geist font)
│   └── globals.css         → Tailwind base styles
├── components/
│   ├── audit/
│   │   ├── spend-form.tsx  → React Hook Form + Zod, dynamic tool entries
│   │   └── audit-results.tsx → Results display with recommendations
│   ├── landing/
│   │   ├── hero.tsx        → Hero section
│   │   ├── value-props.tsx → Value proposition cards
│   │   └── cta-section.tsx → Call-to-action
│   └── ui/                 → shadcn/ui primitives
├── lib/
│   ├── engine/
│   │   ├── analyzer.ts     → Core audit engine (main entry: generateAuditResult)
│   │   ├── catalog.ts      → Pricing catalog (12 tools, verified May 2026)
│   │   ├── calculations.ts → Pure financial math functions [NEW Day 2]
│   │   ├── confidence.ts   → Confidence scoring system [NEW Day 2]
│   │   └── snapshot.ts     → Public audit snapshot sanitization [NEW Day 2]
│   ├── types/
│   │   ├── audit.ts        → Domain types: AuditInput, AuditResult, Recommendation, PublicAuditSnapshot
│   │   └── catalog.ts      → Catalog types: ToolCatalogEntry, PlanTier, PricingModel
│   ├── validations/
│   │   └── audit.ts        → Zod schemas for form validation
│   ├── constants.ts        → App-wide constants
│   └── utils.ts            → cn() utility
└── tests/
    ├── setup.ts            → Vitest + jest-dom setup
    └── engine/
        ├── analyzer.test.ts    → 28 tests: per-tool, overlap, keep, edge cases
        ├── catalog.test.ts     → 29 tests: integrity, lookups, specific tools
        ├── calculations.test.ts → 38 tests: all pure math functions [NEW Day 2]
        ├── confidence.test.ts  → 18 tests: scoring, factors, staleness [NEW Day 2]
        └── snapshot.test.ts    → 13 tests: PII sanitization [NEW Day 2]
```

---

## Day 1 — Foundation (2026-05-07)

### What was built
1. Next.js 16 project scaffold with TypeScript + Tailwind v4 + shadcn/ui
2. Basic domain types: `AuditInput`, `AuditResult`, `Recommendation`
3. Pricing catalog: 10 tools with verified public pricing
4. Audit engine: rightsizing, downgrades, credit matching
5. Landing page: hero, value props, CTA
6. Spend form: React Hook Form + Zod, dynamic tool entries
7. Results UI: summary cards, recommendation cards
8. 23 tests (catalog integrity + analyzer logic)
9. CI pipeline: lint → typecheck → test → build
10. 12 root markdown documentation files

### Key decisions
- Client-side engine first (pure functions, no API)
- Conservative 15% threshold for downgrade recommendations
- Real verified pricing data (not estimates)
- No auth — deliver value before asking anything

---

## Day 2 — Audit Engine Foundation (2026-05-07)

### What was built

#### 1. Enhanced Domain Types (`src/lib/types/audit.ts`)
- Added `RecommendationType` variants: `"keep"`, `"switch-vendor"`, `"review-api-usage"`
- Added `CalculationBreakdown` interface for transparent math display
- Added `PublicAuditSnapshot` + `PublicRecommendation` types for share URL architecture
- Added `ConfidenceReason` for explaining why confidence was assigned
- Added `email`, `notes` fields to `AuditInput` (stripped in public snapshots)
- Added `catalogVersion`, `hasOverlappingTools`, `optimizedToolCount` to `AuditResult`
- Added `AuditSummary` with `totalAnnualSavings` and `savingsPercentage`

#### 2. Catalog Types Enhancement (`src/lib/types/catalog.ts`)
- Added `PricingModel` type: `"per-seat" | "usage-based" | "flat-rate" | "hybrid"`
- Added `vendor` field to `ToolCatalogEntry`
- Added `requiresSalesContact` and `minSeats` to `PlanTier`

#### 3. Pricing Catalog Expansion (`src/lib/engine/catalog.ts`)
- Added Google Gemini (ai-api, 3 plans, startup credits)
- Added v0 by Vercel (ai-assistant, 2 plans)
- All 12 tools now have `pricingModel` and `vendor` fields
- Added `getCheapestPaidPlan()` and `getAlternatives()` helpers
- Bumped catalog version to `2026.05.2`

#### 4. Pure Calculation Utilities (`src/lib/engine/calculations.ts`) [NEW]
- `roundCurrency()` — 2-decimal financial rounding
- `monthlyToAnnual()` / `annualToMonthly()` — period conversions
- `seatCost()` — seat × price calculation
- `excessSeats()` / `excessSeatSavings()` — rightsizing math
- `downgradeSavings()` — plan comparison
- `isSignificantSavings()` — 15% threshold check
- `findOverlappingTools()` — category-based overlap detection
- `consolidationSavings()` — conservative min-of-two savings
- `savingsPercentage()` / `isHighSavings()` — threshold helpers
- `normalizeToPerSeat()` — spend normalization
- `detectOverpayment()` — catalog vs. reported spend mismatch
- Formula builders: `rightsizingFormula()`, `downgradeFormula()`, `consolidationFormula()`

#### 5. Confidence Scoring System (`src/lib/engine/confidence.ts`) [NEW]
- Factor-based scoring: `ConfidenceFactors` interface
- `scoreConfidence()` — objective factor → HIGH/MEDIUM/LOW with reasoning
- Per-type helpers: `rightsizingConfidence()`, `downgradeConfidence()`, `consolidationConfidence()`, `creditConfidence()`
- `isPricingFresh()` — 90-day staleness check
- `defaultConfidenceForType()` — conservative defaults per recommendation type

#### 6. Public Snapshot Architecture (`src/lib/engine/snapshot.ts`) [NEW]
- `createPublicSnapshot()` — strips email, company name, notes, toolIds, calculation details
- `validateSnapshotPrivacy()` — defense-in-depth PII check (email regex + structural)
- Designed for future `/share/:id` route

#### 7. Enhanced Audit Engine (`src/lib/engine/analyzer.ts`)
- Phase 1: Per-tool analysis (rightsizing, downgrades, credits) — now with CalculationBreakdown
- Phase 2: Cross-tool overlap/consolidation detection (`analyzeToolOverlaps`)
- Phase 3: "Keep" recommendations for already-optimized tools (trust signal)
- Phase 4: Priority ranking by savings impact
- Phase 5: Aggregate totals with catalogVersion tracking
- All recommendations now use `scoreConfidence()` instead of hardcoded levels

#### 8. Updated Audit Results UI (`src/components/audit/audit-results.tsx`)
- Shows "Already Optimized" section for keep recommendations
- Shows overlap alert banner when duplicate-category tools detected
- Displays calculation formula in monospace for transparency
- Color-coded confidence badges (green/amber/slate)
- Shows catalog version in methodology disclaimer

#### 9. Comprehensive Test Suite
- **126 total tests** (from 23 on Day 1)
- `calculations.test.ts`: 38 tests — every pure function, edge cases, boundary values
- `confidence.test.ts`: 18 tests — scoring, factor builders, staleness
- `snapshot.test.ts`: 13 tests — PII sanitization, privacy validation
- `analyzer.test.ts`: 28 tests — overlap detection, keep recs, no-savings honesty, edge cases
- `catalog.test.ts`: 29 tests — new tools, pricingModel, vendor, alternatives validation

#### 10. CI Enhancement
- Added `concurrency` with `cancel-in-progress` for faster feedback
- Added `timeout-minutes: 10` safety net
- Verbose test reporter for CI output

---

## Decisions & Tradeoffs

### Why conservative consolidation savings?
We use `Math.min(tool1Spend, tool2Spend)` as the consolidation savings estimate. This is intentionally conservative — if the user is spending $200/mo on Cursor and $50/mo on Copilot, we report $50 savings (not $200). We'd rather undercount than overcount.

### Why "keep" recommendations?
Trust. Showing the user "we evaluated this tool and found no optimization" is more credible than silently omitting it. It demonstrates completeness of analysis.

### Why factor-based confidence scoring?
Hardcoded confidence levels per recommendation type are fragile. The factor-based system (`ConfidenceFactors`) makes confidence derivable from objective criteria: pricing freshness, vendor match, usage assumptions. This is both more accurate and more transparent.

### Why separate calculations.ts?
The calculation functions are pure and independently testable. Keeping them separate from the analyzer (which has orchestration logic) makes both easier to test, extend, and reason about.

### Why the `catalogVersion` field on AuditResult?
When pricing data changes, users who shared audit URLs need to know their audit was based on an older catalog. This enables stale-audit warnings in future UI.

---

## Assumptions

1. **Pricing data is reasonably accurate as of May 2026** — sourced from public pages, but could be stale by the time someone uses the tool.
2. **Team size = seat ceiling** — we assume the user's reported team size is the correct number of seats they need. This is a simplification.
3. **Same-category = potential overlap** — not all tools in the same category are interchangeable, but it's a reasonable first signal.
4. **API-based tools (OpenAI, Anthropic) are harder to audit** — usage-based pricing means we can't compare plans deterministically without actual token usage data.

---

## Technical Debt

1. **Zod v4 + React Hook Form resolver** — requires `as any` cast on `zodResolver()`. Known compatibility issue; should resolve when `@hookform/resolvers` ships Zod v4 adapter.
2. **`watch()` incompatible-library warning** — React Compiler detects that RHF's `watch()` returns unmemoizable values. Suppressed with directive; not a bug.
3. **No server-side audit processing** — engine runs client-side only. Day 3+ should add API routes for persistence.
4. **No Supabase integration** — audit results are in-memory only. No persistence, no history.

---

## What's Remaining (Day 3+)

### Priority 1 (Core Product)
- [ ] Supabase schema design & integration
- [ ] Server-side API routes (`POST /api/audit`, `GET /api/audit/:id`)
- [ ] Audit result persistence (save to DB)
- [ ] Public share URL page (`/share/:id`)
- [ ] Email capture after value delivery

### Priority 2 (UX & Polish)
- [ ] Framer Motion animations on landing page
- [ ] PDF export of audit results
- [ ] AI-generated personalized summary paragraph (non-financial)
- [ ] Audit history page
- [ ] Loading skeleton states

### Priority 3 (Scale & Trust)
- [ ] Automated pricing staleness monitoring
- [ ] Rate limiting on API routes
- [ ] OG image generation for share URLs
- [ ] Analytics / conversion tracking
- [ ] Error boundary components

### Priority 4 (Catalog Expansion)
- [ ] AWS Bedrock / SageMaker
- [ ] Google Cloud Vertex AI
- [ ] Datadog
- [ ] Snowflake
- [ ] Figma (with AI features)
- [ ] Linear / Slack AI

---

## CI Status

| Check | Status |
|-------|--------|
| ESLint | ✅ Clean |
| TypeScript (`tsc --noEmit`) | ✅ Clean |
| Vitest (126 tests) | ✅ All passing |
| Build | ⚠️ Not verified this session (Day 1 build was clean) |

---

## Test Coverage Summary

| Test File | Tests | Coverage Area |
|-----------|-------|---------------|
| `calculations.test.ts` | 38 | Pure math: rounding, seat calcs, downgrades, overlaps, formulas |
| `catalog.test.ts` | 29 | Data integrity, specific pricing, lookup helpers |
| `analyzer.test.ts` | 28 | Engine pipeline: rightsizing, downgrades, overlaps, keeps, edge cases |
| `confidence.test.ts` | 18 | Scoring logic, factor builders, staleness detection |
| `snapshot.test.ts` | 13 | PII sanitization, privacy validation |
| **Total** | **126** | |

---

*Last updated: 2026-05-07 (Day 2)*
*Next update expected: Day 3*
