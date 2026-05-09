import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { sendAuditReportEmail } from "@/lib/email/resend";
import { PublicAuditSnapshot } from "@/lib/types/audit";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { isPayloadTooLarge, isHoneypotTriggered } from "@/lib/security/validation";

const leadSchema = z.object({
  email: z.string().email(),
  companyName: z.string().optional(),
  role: z.string().optional(),
  consultationIntent: z.boolean().default(false),
  auditSlug: z.string(),
});

export async function POST(req: Request) {
  try {
    // 1. Abuse Protection: Payload Size
    const contentLength = req.headers.get("content-length");
    if (isPayloadTooLarge(contentLength)) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    // 2. Abuse Protection: Rate Limiting
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();

    // 3. Abuse Protection: Honeypot
    if (isHoneypotTriggered(body)) {
      // Silently succeed for bots
      return NextResponse.json({ success: true }, { status: 201 });
    }

    // 4. Validate Input
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid lead data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const leadData = parsed.data;
    const supabase = createAdminClient();

    // 5. Look up the audit ID, snapshot, and metadata from the slug
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: audit, error: auditError } = await (supabase.from("audits") as any)
      .select("id, public_snapshot, metadata")
      .eq("slug", leadData.auditSlug)
      .single();

    if (auditError || !audit) {
      return NextResponse.json(
        { error: "Invalid audit reference" },
        { status: 400 }
      );
    }

    // 6. Insert lead into Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: dbError } = await (supabase.from("leads") as any).insert({
      email: leadData.email,
      company_name: leadData.companyName,
      consultation_intent: leadData.consultationIntent,
      audit_id: audit.id,
      metadata: {
        auditSlug: leadData.auditSlug,
      },
    });

    if (dbError) {
      console.error("Failed to insert lead:", dbError);
      return NextResponse.json(
        { error: "Failed to process lead" },
        { status: 500 }
      );
    }

    // 7. Send Transactional Email asynchronously/safely
    const emailResult = await sendAuditReportEmail(
      leadData.email, 
      leadData.auditSlug, 
      audit.public_snapshot as unknown as PublicAuditSnapshot,
      (audit.metadata as Record<string, unknown>)?.aiSummary as string || null,
      leadData.companyName
    );

    if (!emailResult.success) {
      // We don't fail the API request if the email fails. The lead is saved.
      console.warn(`[Lead Capture] Lead saved, but email dispatch failed for ${leadData.email}. Error:`, emailResult.error);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Lead API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
