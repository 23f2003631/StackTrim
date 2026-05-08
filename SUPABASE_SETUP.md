# Supabase Setup Guide

This document outlines the exact steps required to configure the Supabase persistence layer for the StackTrim project. It serves as both onboarding documentation and long-term architectural memory.

## Architecture Decisions

StackTrim uses **Option A Architecture** for its backend persistence. 
Supabase is treated strictly as a managed PostgreSQL database. All operations flow through secure Next.js server-side route handlers using the `SUPABASE_SERVICE_ROLE_KEY`.

### Security Posture
- **No Client Access**: The frontend never talks directly to Supabase. There is no usage of the `anon` key for queries in the browser.
- **RLS (Row Level Security)**: RLS is strictly enabled on all tables, but no policies are created. This ensures a default-deny posture for any accidental client-side access. The `service_role` key automatically bypasses RLS for server-side operations.
- **Data Sanitization**: The private `AuditResult` and input data are persisted separately from the `PublicAuditSnapshot`. The public snapshot is pre-sanitized on the server before storage to absolutely guarantee PII never leaks to public routes.

## Local Setup Instructions

### 1. Environment Variables

The application requires specific environment variables to connect to Supabase.
Copy the `.env.example` file to `.env.local` if it doesn't already exist.

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

> [!WARNING]
> **NEVER** expose the `SUPABASE_SERVICE_ROLE_KEY` to the browser. It must never be prefixed with `NEXT_PUBLIC_`.

### 2. Executing Migrations

Since we do not enforce the usage of the local Supabase CLI, you must manually run the SQL migrations in your Supabase project's SQL Editor.

1. Navigate to your Supabase Project Dashboard.
2. Open the **SQL Editor**.
3. Create a new query.
4. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`.
5. Run the query.

### 3. Verification

After running the migration, verify that the following tables exist in the `public` schema:
- `audits`
- `leads`
- `events`

Verify that Row Level Security is active for all three tables.

## Table Structures

### `audits`
Stores the core audit lifecycle data.
- `id` (UUID): Internal primary key.
- `slug` (TEXT): A non-guessable `nanoid` used for public sharing.
- `input_data` (JSONB): The raw form inputs from the user.
- `result_data` (JSONB): The full, private deterministic evaluation result.
- `public_snapshot` (JSONB): A highly sanitized version of the results, completely stripped of emails, company names, and internal notes.
- `catalog_version`, `engine_version`: Used for reproducibility.
- `total_monthly_savings`, `total_annual_savings`: Numeric aggregates for fast analytics.
- `metadata`: Arbitrary structured metadata (e.g. counts, confidence flags).

### `leads`
Used in Day 4 for email capture and sales intent.
- `email`, `company_name`, `role`: User contact details.
- `audit_id`: Foreign key linking the lead to their specific audit.

### `events`
A flexible table for tracking product analytics and conversion funnels.
