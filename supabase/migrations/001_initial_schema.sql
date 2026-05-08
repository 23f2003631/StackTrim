-- StackTrim Option A Architecture
-- Execute this migration manually in the Supabase SQL Editor.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Audits Table
CREATE TABLE public.audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    input_data JSONB NOT NULL,
    result_data JSONB NOT NULL,
    public_snapshot JSONB NOT NULL,
    catalog_version TEXT NOT NULL,
    engine_version TEXT NOT NULL DEFAULT '1.0.0',
    total_monthly_savings NUMERIC NOT NULL DEFAULT 0,
    total_annual_savings NUMERIC NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast slug lookups
CREATE INDEX idx_audits_slug ON public.audits(slug);

-- 2) Leads Table
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    company_name TEXT,
    role TEXT,
    consultation_intent BOOLEAN NOT NULL DEFAULT false,
    audit_id UUID REFERENCES public.audits(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for lead lookups by email
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_audit_id ON public.leads(audit_id);

-- 3) Events Table (Optional Analytics)
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE,
    event_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_audit_id ON public.events(audit_id);
CREATE INDEX idx_events_type ON public.events(event_type);

-- Row Level Security (RLS)
-- Since all data access goes through the Next.js server-side route handlers using the SERVICE_ROLE_KEY,
-- we enforce strict RLS denying all direct client access.

ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- No policies are created for anon or authenticated roles.
-- The service_role key bypasses RLS by default.
