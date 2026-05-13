# StackTrim

> Find wasted AI spend before your next invoice.

StackTrim is an operational intelligence platform that audits your AI tool subscriptions, detects overlapping capabilities, and surfaces actionable savings using deterministic, public-catalog pricing data.

## Why This Project Exists

In the current SaaS environment, teams quickly accumulate fragmented AI tooling—Cursor for engineering, Notion AI for product, Copilot for enterprise, and standalone ChatGPT licenses. This overlap creates silent financial waste. 

StackTrim was built to prove that **financial tooling must be deterministic**. While generative AI is used for narrative synthesis, the core audit engine relies exclusively on hard-coded public pricing to ensure 100% trustworthy recommendations.

## Product Philosophy & Engineering Decisions

- **Value First, Identity Later**: Users receive a full audit *before* we ask for an email. This is an intentional product-led growth (PLG) decision.
- **Deterministic Financials**: The core engine runs entirely on deterministic rules. AI is **never** used to calculate savings or hallucinate prices.
- **AI Boundaries Intentionally Enforced**: We use LLMs (Gemini v2.0) purely to synthesize the deterministic output into an executive summary. If the AI fails, a deterministic fallback summary is used. The UX never breaks.
- **Lightweight Infrastructure**: We avoided enterprise-heavy orchestrators in favor of Next.js App Router, Supabase, and strict Zod validation. This ensures the app is fast, deployable, and easy to maintain.
- **Public/Private Data Separation**: Audit snapshots are heavily sanitized before persistence. No PII is tied to the public share link. Lead captures are stored in a completely separate Supabase table.

## Architecture Principles

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion, shadcn/ui
- **Persistence**: Supabase (PostgreSQL) with strict Row-Level Security
- **Server/Client Boundaries**: All DB and API calls execute securely server-side. No service-role keys leak to the client bundle.
- **Observability**: Custom structured logger (`logger.ts`) for internal tracking and analytics event abstraction.
- **Async Rendering Strategy**: AI generation and transactional emails are triggered asynchronously. The deterministic result page renders immediately, and the AI summary fades in once ready, governed by a strict 4-second timeout.

## Security & Privacy

- **No Secrets on Client**: API keys for Supabase, Resend, and Gemini remain exclusively on the server.
- **Row-Level Security (RLS)**: Supabase tables (`audits`, `leads`, `events`) are locked down with a default deny. All inserts use the `createAdminClient` via server actions.
- **Rate Limiting**: In-memory IP tracking protects `/api/audit` and `/api/lead` routes against abuse.
- **Sanitization**: All user inputs are validated via Zod schemas at the API boundary.

## Known Tradeoffs

- **In-Memory Rate Limiting**: Currently, rate limiting relies on an in-memory Map. For multi-region serverless deployments, this should be migrated to Redis (e.g., Upstash) for distributed tracking.
- **PDF Export via Browser Print**: The PDF export currently uses optimized `@media print` CSS. In the future, this could be migrated to a server-side Puppeteer/Chromium service for more rigid PDF generation.
- **Dual Supabase Queries**: Share pages currently perform a dual query (one for metadata, one for the page). This is acceptable at current scale but could be wrapped in React's `cache()` for deduplication.

## Future Roadmap

1. **SAML/SSO Integration**: Add enterprise authentication for larger teams.
2. **Automated De-provisioning**: Integrate with Okta/Google Workspace to automatically revoke unused licenses.
3. **Plaid/Stripe Integration**: Move from manual stack input to automated expense scanning via corporate cards.

## Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/23f2003631/StackTrim.git
   cd StackTrim
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file:
   ```env
   # Deterministic AI Summaries
   GEMINI_API_KEY="your-gemini-key"

   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

   # Transactional Email (Resend)
   RESEND_API_KEY="your-resend-key"
   RESEND_FROM_EMAIL="onboarding@resend.dev" # Use verified domain in prod

   # Site Configuration (Optional)
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   ```

3. **Supabase Setup**:
   - Run the SQL migration in `supabase/migrations/001_initial_schema.sql` against your Supabase project.

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

## Testing

The audit engine is rigorously tested. We enforce a 100% green test policy for all financial calculations.

```bash
npm test
```
*(158 passing tests across deterministic engine logic, snapshot boundaries, analytics, and fallback paths).*

## How to Demo

Please see [DEMO_SCENARIOS.md](DEMO_SCENARIOS.md) for pre-configured use cases perfect for recruiter walkthroughs, Loom demonstrations, and testing fallback behaviors.

For deployment instructions, refer to [DEPLOYMENT.md](DEPLOYMENT.md).

---