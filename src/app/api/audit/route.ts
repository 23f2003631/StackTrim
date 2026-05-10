import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auditInputSchema } from "@/lib/validations/audit";
import { generateAuditResult } from "@/lib/engine/analyzer";
import { createPublicSnapshot } from "@/lib/engine/snapshot";
import { createAdminClient } from "@/lib/supabase/server";

import { checkRateLimit } from "@/lib/security/rate-limit";
import { isPayloadTooLarge, isHoneypotTriggered } from "@/lib/security/validation";
import { logger } from "@/lib/observability/logger";

export async function POST(req: Request) {
  try {
    // 1. Abuse Protection: Payload Size
    const contentLength = req.headers.get("content-length");
    if (isPayloadTooLarge(contentLength)) {
      logger.warn("Payload too large", { contentLength });
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    // 2. Abuse Protection: Rate Limiting
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(ip)) {
      logger.warn("Rate limit exceeded", { ip });
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();

    // 3. Abuse Protection: Honeypot
    if (isHoneypotTriggered(body)) {
      // Silently succeed for bots
      logger.info("Honeypot triggered", { ip });
      return NextResponse.json({ slug: "bot-trap" }, { status: 201 });
    }

    // 4. Validate Input
    const parsed = auditInputSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn("Invalid audit input data", { error: parsed.error.format() });
      return NextResponse.json(
        { error: "Invalid input data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const inputData = parsed.data;

    // 2. Run Deterministic Audit Engine
    const auditResult = generateAuditResult(inputData);

    // 3. Generate Public Snapshot (PII stripped)
    const publicSnapshot = createPublicSnapshot(auditResult);

    // 4. Generate secure, non-guessable slug
    // 10 chars is ~14 trillion combinations, plenty for this use case
    const slug = nanoid(10);

    // 5. Persist to Supabase
    // We use the admin client because this route handles server-side logic
    // and we want to bypass RLS to insert securely.
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insertedAudit, error: dbError } = await (supabase.from("audits") as any).insert({
      slug,
      input_data: JSON.parse(JSON.stringify(inputData)), // Convert to pure JSON objects
      result_data: JSON.parse(JSON.stringify(auditResult)),
      public_snapshot: JSON.parse(JSON.stringify(publicSnapshot)),
      catalog_version: auditResult.catalogVersion,
      engine_version: "1.0.0",
      total_monthly_savings: auditResult.totalMonthlySavings,
      total_annual_savings: auditResult.totalAnnualSavings,
      metadata: {
        hasHighSavings: publicSnapshot.metadata.hasHighSavings,
        hasOverlappingTools: publicSnapshot.metadata.hasOverlappingTools,
        optimizedToolCount: publicSnapshot.metadata.optimizedToolCount,
      },
    }).select("id").single();

    if (dbError || !insertedAudit) {
      logger.error("Supabase insert error", { error: dbError });
      return NextResponse.json(
        { error: "Failed to persist audit result." },
        { status: 500 }
      );
    }

    // 5.5 Log Analytics Event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("events") as any).insert({
      event_type: "audit_completed",
      audit_id: insertedAudit.id,
      event_data: {
        toolCount: auditResult.input.tools.length,
        totalSavings: auditResult.totalMonthlySavings,
        hasHighSavings: publicSnapshot.metadata.hasHighSavings,
      },
    });

    logger.metric("Audit completed successfully", { slug, savings: auditResult.totalMonthlySavings });

    // 6. Return success with slug
    return NextResponse.json({ slug }, { status: 201 });
  } catch (error) {
    logger.error("Audit API Error", { error });
    
    // Check if it's the missing credentials error from createAdminClient
    if (error instanceof Error && error.message.includes("Missing Supabase server credentials")) {
      return NextResponse.json(
        { error: "Supabase credentials missing. Please configure .env.local with your Supabase URL and Service Role Key." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
