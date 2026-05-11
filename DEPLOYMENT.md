# StackTrim Deployment Guide

This guide outlines how to deploy StackTrim to Vercel, configure the required external services (Supabase, Resend, Gemini), and ensure operational resilience in a production environment.

## 1. Prerequisites

Before deploying, ensure you have accounts and access to the following services:
- **Vercel** (for hosting Next.js)
- **Supabase** (for PostgreSQL database)
- **Resend** (for transactional emails)
- **Google AI Studio** (for Gemini API keys)

## 2. Environment Variables

StackTrim relies on several environment variables. You must add these to your Vercel project settings under **Settings > Environment Variables**.

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (Never leak this to the client) | Yes |
| `GEMINI_API_KEY` | Google Gemini API Key | Yes |
| `RESEND_API_KEY` | Resend API key for transactional emails | Yes |
| `RESEND_FROM_EMAIL` | Verified sending domain email (e.g. `audit@stacktrim.dev`) | Yes |
| `NEXT_PUBLIC_SITE_URL` | Canonical domain used for OG image generation and SEO | Optional |

> [!WARNING]
> Do NOT prefix `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, or `RESEND_API_KEY` with `NEXT_PUBLIC_`. These must remain exclusively on the server.

## 3. Vercel Deployment Setup

1. Push your repository to GitHub.
2. In the Vercel dashboard, click **Add New > Project**.
3. Import your StackTrim repository.
4. Open the **Environment Variables** section and paste the required keys.
5. Click **Deploy**.

Vercel will automatically detect the Next.js framework, run `npm install`, and execute `npm run build`.

## 4. Supabase Setup

StackTrim uses Supabase for storing audit snapshots, lead captures, and analytics events.

1. Create a new Supabase project.
2. Navigate to **SQL Editor** in your Supabase dashboard.
3. Execute the `supabase/migrations/001_initial_schema.sql` script.
4. Ensure Row Level Security (RLS) is enabled on all tables (Audits, Leads, Events) with default deny. All operations should run via the `createAdminClient` utilizing the Service Role Key on the server.

## 5. Resend Setup

1. Add your custom domain to Resend.
2. Update your DNS provider with the requested TXT/MX records to verify the domain.
3. Update `RESEND_FROM_EMAIL` in Vercel to match your verified domain.

## 6. Deployment Verification Checklist

After deploying, walk through the following scenarios to ensure operational stability:
- [ ] **Home Page Loads**: Check Core Web Vitals and ensure no client-side hydration errors occur.
- [ ] **Audit Generation**: Submit a sample stack and confirm the result renders securely.
- [ ] **AI Summary**: Wait 4 seconds on the results page to ensure the Gemini summary fades in smoothly.
- [ ] **Email Delivery**: Provide an email address, verify the lead is captured in Supabase, and check your inbox for the audit report.
- [ ] **OG Image Generation**: Paste the share link into a social preview tool (like X or Slack) to ensure the dynamic OG image renders.
- [ ] **PDF Export**: Click the "Print / Export PDF" button and verify the print stylesheet is applied properly.

## 7. Graceful Degradation & Caveats

StackTrim is engineered to survive third-party outages. If services fail in production, the application will degrade gracefully:

* **Gemini Outage / Quota Exhaustion**: The AI summary will fall back to a deterministic, rule-based summary. The user experience will not break.
* **Resend Outage**: If the transactional email fails, the lead is still securely captured in Supabase for manual follow-up.
* **Analytics Failure**: If the `events` table insert fails, the error is swallowed securely on the server so the client application does not crash.
