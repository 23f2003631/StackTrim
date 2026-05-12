import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability/logger";
import { z } from "zod";

const eventSchema = z.object({
  type: z.enum([
    "audit_started",
    "audit_completed",
    "audit_failed",
    "lead_captured",
    "share_link_copied",
    "pdf_exported",
    "public_audit_viewed",
    "ai_summary_generated",
    "ai_summary_fallback_used",
    "ai_summary_quota_exhausted",
    "ai_summary_timeout",
    "ai_summary_missing_key",
    "ai_summary_provider_failed",
    "consultation_cta_clicked",
    "pricing_mismatch_detected",
    "catalog_pricing_reset_clicked",
    "manual_pricing_override_enabled",
  ]),
  auditId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = eventSchema.safeParse(body);

    if (!parsed.success) {
      logger.warn("Invalid event payload received", { error: parsed.error.format() });
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { type, auditId, metadata } = parsed.data;

    const supabase = createAdminClient();
    
    // Using any-cast to avoid deep type matching issues with Supabase generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("events") as any).insert({
      event_type: type,
      audit_id: auditId,
      event_data: metadata || {},
    });

    if (error) {
      logger.error("Failed to persist event to Supabase", { type, error });
      // We don't fail the client request on analytics failure
    } else {
      logger.metric("Analytics event tracked", { type, auditId });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logger.error("Event API error", { error });
    // Silently succeed so clients don't crash
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
