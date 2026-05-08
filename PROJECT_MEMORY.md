# PROJECT MEMORY

## Mission
Build StackTrim, a high-stakes AI spend audit platform optimized for B2B SaaS founders and engineering leaders. The product must feel premium, trustworthy, financially literate, and operationally mature.

## Execution Ledger

### Day 1: Foundation
- Scaffolding with Next.js App Router, Tailwind v4, Shadcn UI.
- Deterministic analysis engine core built (`lib/engine/calculations.ts`).
- Pricing catalog architecture established (`lib/engine/catalog.ts`).
- Premium landing page and CTA developed.

### Day 2: Testability & Confidence
- Implemented robust confidence scoring (`lib/engine/confidence.ts`) for tool recommendations (e.g. HIGH/MEDIUM/LOW confidence).
- Separated public snapshot generation to enforce privacy boundaries (`lib/engine/snapshot.ts`).
- Setup CI workflows for deterministic automated testing.
- Overhauled test suites (126 deterministic tests passing).

### Day 3: Backend Persistence & SaaS Execution
- **Architecture Shift**: Transformed from a purely client-side evaluation tool to a persistent, backend-driven SaaS.
- **Supabase Integration**:
  - Implemented **Option A Architecture**. 
  - `audits`, `leads`, and `events` tables constructed.
  - Strict Server/Client boundary: `SUPABASE_SERVICE_ROLE_KEY` is isolated in `src/lib/supabase/server.ts` and never leaks to the client.
  - RLS strictly enabled for a default-deny posture on all tables.
- **Route Handlers**: Created `POST /api/audit` to execute the audit deterministically on the server, ensuring client cannot manipulate results before persistence.
- **Public Share URLs**:
  - Generated non-sequential, non-guessable, URL-safe slugs using `nanoid`.
  - Implemented `/share/[slug]` route for public snapshot rendering.
  - Snapshot logic strictly strips PII (company, email) before Database persistence to `public_snapshot` JSON column.
- **Form Persistence**:
  - Developed robust LocalStorage syncing in `SpendForm` to protect user data from accidental reloads.
- **Premium UX Overhaul (Screenshot Priority)**:
  - Redesigned `AuditResults` hero section to heavily emphasize "Monthly Savings" and "Annual Savings" using premium gradients and layout.
  - Upgraded `RecommendationCard` to clearly show rationale, calculation methodology, confidence scores, and current/future spend.
  - Implemented an "Honest Empty State" when no savings are found, rather than manufacturing fake savings.

## Next.js App Router Pitfalls & Fixes (Day 3 Addendum)
- **Asynchronous Route Params**: In Next.js 15+, `params` passed to pages and layouts is a Promise. Accessing properties synchronously (e.g., `params.slug`) evaluates to `undefined`, which caused the Supabase query `.eq("slug", params.slug)` to silently fail and trigger the 404 `notFound()` fallback. The page was updated to explicitly `await params` (`const { slug } = await params;`).
- **Supabase Environment Variables**: Ensure `NEXT_PUBLIC_SUPABASE_URL` is a fully qualified URL (e.g., `https://[ref].supabase.co`). Missing the protocol causes silent URL parsing failures.

## File Structure Map
- `src/app/api/audit/route.ts` - Central processing and DB persistence handler.
- `src/app/share/[slug]/page.tsx` - Public, sanitized result page.
- `src/components/audit/spend-form.tsx` - Complex dynamic form with LocalStorage recovery.
- `src/components/audit/audit-results.tsx` - Premium financial result presentation.
- `src/lib/supabase/` - Client and server boundaries for Supabase.
- `supabase/migrations/` - SQL migration source of truth.
- `SUPABASE_SETUP.md` - Mandatory setup instructions and architectural rationale.

## Future Context (Day 4+)
- **Lead Capture**: We have a `leads` table ready. Future implementation should gate high-value details behind an email capture or offer a "book a consultation" flow.
- **Analytics**: The `events` table is primed for funnel tracking.
- **Benchmark Mode**: Result metadata includes `hasHighSavings` and `optimizedToolCount` to enable future industry benchmarking dashboards.

## Engineering Standards
- **Trust First**: No AI-driven hallucinations in financial outputs.
- **Strict Typing**: All schemas, inputs, and outputs use rigid Zod and TS definitions.
- **Screenshot Worthy**: Every final user-facing view must look worthy of a Product Hunt launch.
