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

### Phase 4: Financial Realism & Trust Modeling (Current)
- **Realism Moderation**: Savings classified into `normal`, `aggressive`, and `extreme` tiers.
- **Partial Optimization**: No longer assumes 100% seat reduction; uses `calculateOptimizableSeats` to account for organizational overhead.
- **Structured Reasoning**: Recommendations now include `detectedSignals` and `usageAssumptions` for boardroom-quality transparency.
- **Confidence Overhaul**: High confidence is now rare and reserved for simple, deterministic, and pricing-consistent opportunities.
- **Executive PDF**: Redesigned Page 2 to include Methodology, Philosophy, and Enterprise Disclaimers.

### Financial Realism & Trust Model
StackTrim operates as a **conservative operational advisor**, not an optimization calculator. 

**Core Principles:**
1. **Trust Over Numbers**: We prefer believable 15% savings over unrealistic 70% savings.
2. **Organizational Inertia**: We assume companies cannot cut 100% of excess seats immediately.
3. **Enterprise Awareness**: Large teams (10+) on "critical" tools (Slack, GitHub) are rarely candidates for Free-tier downgrades due to security/compliance needs.
4. **Deterministic Integrity**: All financial calculations are deterministic. AI is strictly used for narrative and summarization.

**Realism Thresholds:**
- **0-15% (Normal)**: Low friction, high believability.
- **15-35% (Aggressive)**: Requires operational audit.
- **35%+ (Extreme)**: Highly suspicious; results depend on extreme organizational change.

**Reasoning Engine:**
Every recommendation must explain **WHY** it exists (Detected Signals) and what **ASSUMPTIONS** were made (Usage/Migration).

### Day 4: Lead Generation & Trust UX
- **AI Summary Integration**:
  - Implemented `@google/genai` to generate personalized summaries.
  - Architecture: Non-blocking async fetch from `/api/audit/[slug]/summary` via the `AuditResults` client component.
  - Guardrails: 4-second `AbortController` timeout and resilient deterministic fallbacks to guarantee the user experience never breaks during API failures.
- **Conversion-Optimized UX**:
  - High-savings ($>500/mo) result pages now feature a premium CTA ("Discuss these savings") mapped to a lead capture form.
  - Added an "Honest Empty State" and "Already Optimized" states for zero-savings audits, reinforcing transparency over aggression.
  - Implemented an expandable "Why this recommendation?" section outlining calculation mechanisms.
  - Added clear UI disclosures affirming that financial metrics are fully deterministic, while AI is strictly constrained to narrative summarization.
- **Transactional Architecture (Resend)**:
  - Upgraded `src/lib/email/resend.ts` to use a semantic, minimalist HTML template (`src/lib/email/templates/audit-report.ts`) rendering the full audit summary, savings, and trust bounds.
  - **Environment-Based Sender**: Implemented `RESEND_FROM_EMAIL` configuration. Defaulted to `StackTrim <onboarding@resend.dev>` for development/testing as the primary domain (`stacktrim.com`) is not yet verified in Resend.
  - Implemented safe async email boundaries: `POST /api/lead` successfully records leads *before* triggering the email. Email failures are caught and logged as `[Email Delivery Failed]`, allowing the API to return a 201 without breaking the user experience.
  - Avoided over-engineered React-email builders to keep dependencies low and maintenance fast.
- **Abuse Protection**:
  - Implemented lightweight, in-memory IP rate limiting (`src/lib/security/rate-limit.ts`).
  - Added strict payload size constraints and hidden honeypot validation (`website_url` bot trap).

### Day 4 Stabilization: Lint & Type Hardening
- **Zero-Failure CI Baseline**: Successfully reached 100% lint cleanliness (`npm run lint`) and strict type safety (`npx tsc --noEmit`).
- **Type Safety Refinement**:
  - Eliminated all `@typescript-eslint/no-explicit-any` violations in security, email, and API layers.
  - Used `Record<string, unknown>` and proper type narrowings to secure data flow from external providers.
  - Resolved `react/no-unescaped-entities` for production-grade JSX.
- **Hook & Compiler Stabilization**:
  - Fixed `react-hooks/incompatible-library` warnings in `SpendForm` by migrating to `useWatch` for tool changes and implementing a `useRef` + `useEffect` pattern for stable form subscriptions.
  - Corrected hydration mismatches by ensuring `isMounted` state updates are non-blocking via `requestAnimationFrame`.
- **API Boundary Hardening**:
  - Aligned `@google/genai` integration with v2.0 specifications (`models.generateContent` with `Contents` arrays).
  - Fixed Supabase table inference issues in API routes using targeted, documented any-casts for complex queries while maintaining result-set type safety.
  - Verified 132 automated tests passing post-stabilization.

## File Structure Map
- `src/app/api/audit/route.ts` - Central processing and DB persistence handler.
- `src/app/share/[slug]/page.tsx` - Public, sanitized result page.
- `src/components/audit/spend-form.tsx` - Complex dynamic form with LocalStorage recovery and stable hook architecture.
- `src/components/audit/audit-results.tsx` - Premium financial result presentation.
- `src/lib/supabase/` - Client and server boundaries for Supabase.
- `src/lib/ai/` - Resilient Gemini v2.0 integrations with deterministic fallbacks.
- `supabase/migrations/` - SQL migration source of truth.
- `SUPABASE_SETUP.md` - Mandatory setup instructions and architectural rationale.

### Day 5: Launch-Quality Polish & Premium Features
- **Dynamic OG Image Generation**:
  - Created `src/app/share/[slug]/opengraph-image.tsx` using Next.js `ImageResponse`.
  - Premium dark-themed design: dominant annual savings number, minimal branding, catalog version footer.
  - Auto-generates per-audit OG images for social sharing (LinkedIn, Twitter, Product Hunt).
- **Dynamic Share Page Metadata**:
  - Converted static `metadata` export to `generateMetadata()` in `/share/[slug]/page.tsx`.
  - Per-audit title, description, OpenGraph, and Twitter Card tags.
  - Trust messaging footer: "Public links never expose private company details."
- **Dedicated Print/PDF Route** (`/share/[slug]/print`):
  - Isolated print-optimized layout at `src/app/share/[slug]/print/page.tsx`.
  - Clean, investor-ready report with: summary metrics, executive summary, recommendations, and professional footer.
  - Includes generated timestamp, catalog version, engine version, and StackTrim disclosure.
  - Auto-triggers `window.print()` on mount for immediate PDF save.
  - Architecture designed to be future-compatible with server-side PDF generation.
- **Result Page Polish**:
  - Subtle Framer Motion entrance animations (Ramp/Mercury aesthetic — fade-up, stagger).
  - Skeleton placeholder for AI summary loading instead of simple spinner.
  - Copy-to-clipboard "Share" button with calm success feedback.
  - PDF export button linking to dedicated print route.
  - Improved accessibility: `aria-expanded`, `aria-label`, `role="alert"`, `role="status"`.
- **Premium Loading States**:
  - Created `AuditLoading` component with phased progress indicators.
  - Integrated into `SpendForm` — replaces form during submission.
  - Phases: "Validating input data...", "Running audit engine...", "Detecting overlaps...", etc.
- **AI Summary Performance**:
  - Added `AbortController` with 8s timeout on client-side summary fetch.
  - Added `Cache-Control` headers: cached summaries get `max-age=3600`, fresh get `max-age=300`.
- **Lead Capture Polish**:
  - Calm success state with subtle emerald tones and check icon.
  - Improved form accessibility: unique label IDs, `autoComplete`, `role="alert"`.
- **SEO & Metadata Optimization**:
  - Added `metadataBase` for proper OG URL resolution.
  - Title template: `%s — StackTrim`.
  - JSON-LD structured data (`WebApplication` schema).
  - Canonical URLs and robots directives.
- **Expanded Test Coverage**: 153 tests (up from 132).
  - OG metadata formatting tests (11 new).
  - Print/PDF formatting tests (10 new).

## Day 5 Stabilization Pass (Post-Implementation)

**All quality gates confirmed green:**

| Gate | Result |
|------|--------|
| `npm run lint` | ✅ Zero errors |
| `npx tsc --noEmit` | ✅ Zero errors |
| `npm test` | ✅ 153 tests (9 test files) |
| `npm run build` | ✅ Clean production build |

**Security verification:**
- ✅ All share routes use `public_snapshot` only — no PII leakage.
- ✅ `createAdminClient()` stays server-side only (server components + API routes).
- ✅ No environment variables or service-role keys exposed to client bundles.
- ✅ Honeypot and rate limiting active on all POST routes.
- ✅ All metrics piped through an internal API route to the `events` table (no client-side Supabase credentials).

**Async resilience verification:**
- ✅ AI summary fetches via client `useEffect` — never blocks SSR of deterministic content.
- ✅ `AbortController` with 8s timeout on client-side summary fetch.
- ✅ Gemini API has 4s server-side timeout + deterministic fallback.
- ✅ Lead is persisted before email dispatch; email failure never blocks lead save.
- ✅ Missing `GEMINI_API_KEY` triggers clean fallback path (verified in tests).

**Mobile responsiveness verification:**
- ✅ Hero cards stack to single column on mobile (`sm:grid-cols-3` default `grid-cols-1`).
- ✅ Print view header/grid/footer responsive (flex-col on small screens).
- ✅ Audit ID badge hidden on mobile to prevent header crowding.
- ✅ Share/PDF buttons visible on mobile.

## Known Technical Debt

1. **Dual Supabase query on share pages**: `generateMetadata()` and page component both call `createAdminClient()` separately. Next.js `fetch` deduplication doesn't apply to Supabase SDK. Could wrap with React `cache()`. Low priority at current scale.
2. **No E2E tests**: Full "Audit → Share → Lead → Email" journey untested end-to-end. Playwright recommended.
3. **No share page `loading.tsx`**: Next.js streaming handles this, but a custom skeleton could improve perceived quality.
4. **Print CSS in inline `<style>` tag**: Works correctly, could be extracted to globals.css for cleanliness.

## Day 6 Additions (Analytics & Telemetry)
- **`src/lib/observability/logger.ts`**: Centralized structured logging for all API routes and engine actions.
- **`src/lib/config/flags.ts`**: Feature flag configuration for seamless toggle of experimental UI components.
- **Analytics Events**: Plumbed via `src/lib/analytics/events.ts` and `src/app/api/events/route.ts` tracking `audit_started`, `audit_completed`, `share_link_copied`, `pdf_exported`, `lead_captured`, `ai_summary_generated`.
- **Internal Dashboard**: Built an operational telemetry view at `/internal/insights` using aggregated database stats.
- **Insights Components**: `BenchmarkInsight` and `TopOpportunities` seamlessly integrated into the public audit view.
- **Core refactor**: Consolidated `formatCurrency` to `src/lib/utils/format.ts`.

## Day 7: Final Deployment Hardening & Stabilization

- **Global Error Boundaries**: Created `src/app/error.tsx` and `src/app/not-found.tsx` to handle uncaught errors gracefully without leaking stack traces.
- **UI/UX Polish**: Extracted print styles from inline `<style>` tags into `globals.css` and fixed unescaped React quotes.
- **Documentation Overhaul**: 
  - Rewrote `README.md` to YC-demo quality, adding explicit architectural tradeoffs, product philosophy, and security documentation.
  - Created `DEMO_SCENARIOS.md` to curate the perfect recruiter walkthrough.
  - Extracted deployment specifics into `DEPLOYMENT.md` covering Vercel, Supabase, Resend, and Gemini.
- **Graceful Fallbacks First**: Re-verified all fallback logic for API key absences and third-party downtime. The system degrades to deterministic results, never 500ing on the client.
- **Architecture Freeze**: Refused unnecessary rewrites in favor of stability and polish.

### Day 8: Pricing Consistency & Stateful Optimization Pipeline
- **Pricing Consistency Engine (`pricing.ts`)**: Implemented `PricingMismatchSeverity` (none, low, medium, high, extreme) to classify trust levels when users override catalog pricing.
- **Bounded Savings**: Added `capSavingsPotential` to prevent mathematically impossible savings in cases of extreme pricing mismatch (e.g., capping at 2x catalog theoreticals).
- **Stateful Optimization Pipeline (`pipeline.ts`)**: Refactored the audit engine from a naive additive model to a sequential pipeline.
    - **Priority Order**: `Consolidate` -> `Downgrade` -> `Rightsize` -> `Credits`.
    - **Dependency Resolution**: Each optimization step updates the tool's `OptimizedToolState`. Subsequent steps (e.g., rightsizing) use the *new* plan price if a downgrade was already applied.
    - **Anti-Double-Counting**: Total savings are calculated as the difference between original total and final optimized total, ensuring they never exceed 100%.
- **Pipeline Awareness in UI**: Added `contextualNote` to recommendations (e.g., "Assumes previous plan optimization") to maintain trust in the additive logic.
- **Test Coverage**: Added `pipeline.test.ts` to verify complex multi-step optimization scenarios. Total test count is now 172.
- **Frontend UX (Manual Override)**:
  - `SpendForm` now features intelligent auto-fill from catalog data with a "Manual Override" state.
  - Added a premium "Custom pricing active" UI badge with contextual tooltips explaining enterprise/negotiated contract assumptions.
  - Implemented "Use catalog pricing" reset flow with integrated analytics.
- **Sanitization & Public Transparency**:
  - Extended `PublicAuditSnapshot` and `PublicRecommendation` to include `customContractLikely` metadata.
  - Surfaced "Custom pricing" indicators on share pages and PDF exports to signal operational skepticism.
- **Observability & Analytics**:
  - Added telemetry for `pricing_mismatch_detected`, `manual_pricing_override_enabled`, and `catalog_pricing_reset_clicked`.
- **Build & Test**:
  - Reached 169 automated tests passing (+16 new tests for pricing boundaries and analyzer logic).

## Deployment Notes

- **Required env vars**: `GEMINI_API_KEY`, `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_FROM_EMAIL`.
- **Optional env var**: `NEXT_PUBLIC_SITE_URL` — used for metadataBase, JSON-LD canonical URL, and OG image URL resolution. Defaults to `https://stacktrim.dev`.
- **Resend domain**: Currently using `onboarding@resend.dev` in development. Requires verified domain for production.
- **Build target**: `npm run build` produces static pages (`/`, `/audit`) and dynamic routes (`/api/*`, `/share/*`).
- **No edge runtime**: All server components use default Node.js runtime. OG image explicitly sets `runtime = "nodejs"`.

## Future Context (Day 7+)
- **SAML/SSO Integration**: Add enterprise authentication for larger teams.
- **Automated De-provisioning**: Integrate with Okta/Google Workspace to automatically revoke unused licenses.
- **Server-Side PDF**: The `/share/[slug]/print` architecture is designed to support migration to Puppeteer/Chromium-based PDF generation when needed.
- **E2E Testing**: Add Playwright scenarios for the full "Audit → Lead Capture → Email" journey.
- **React `cache()` wrapper**: Deduplicate Supabase queries in share page metadata + component.

## Engineering Standards
- **Trust First**: No AI-driven hallucinations in financial outputs.
- **Strict Typing**: All schemas, inputs, and outputs use rigid Zod and TS definitions.
- **Screenshot Worthy**: Every final user-facing view must look worthy of a Product Hunt launch.
- **Ramp/Mercury Aesthetic**: Animations are subtle, finance-appropriate, and never flashy.
- **Graceful Degradation**: Every external provider boundary (AI, Email, DB) has explicit fallback behavior.
