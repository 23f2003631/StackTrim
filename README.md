# StackTrim

> Find wasted AI spend before your next invoice.

StackTrim is an operational intelligence platform that audits your AI tool subscriptions, detects overlapping capabilities, and surfaces actionable savings using deterministic, public-catalog pricing data.

## Product Philosophy
- **Value First, Identity Later**: Users receive a full audit *before* we ask for an email.
- **Deterministic Financials**: The core engine runs entirely on deterministic rules and public pricing data. AI is **never** used to calculate savings or hallucinate prices.
- **Narrative Context**: We use LLMs (Gemini v2.0) purely to synthesize the deterministic output into an executive summary.
- **Conservative Estimates**: If we aren't 100% sure you can save money, we don't recommend it.

## Architecture Highlights
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion, shadcn/ui
- **Persistence**: Supabase (PostgreSQL) with strict Row-Level Security
- **Server/Client Boundaries**: All DB and API calls execute securely server-side. No service-role keys leak to the client bundle.
- **Observability**: Custom structured logger for internal tracking and analytics event abstraction.
- **Async Rendering**: AI generation and transactional emails fail gracefully without blocking the deterministic core path.

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
The audit engine is rigorously tested.
```bash
npm test
```
(158 passing tests across deterministic engine logic, snapshot boundaries, analytics, and fallback paths).

## Launch-Ready Features
- **Dynamic OG Image Generation**: Automatic social cards for shareable audits.
- **Professional PDF Export**: A dedicated `/share/[slug]/print` route optimized for board presentations.
- **Lead Capture & Transactional Email**: Automated audit delivery workflows.
- **Internal Dashboard**: Lightweight admin telemetry at `/internal/insights`.
- **Benchmark Intelligence**: Real-time stack efficiency comparisons based on identified waste.

*StackTrim — Built for operational rigor.*
