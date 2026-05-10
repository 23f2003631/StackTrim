import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateAuditSummary } from "@/lib/ai/summary";
import { PublicAuditSnapshot } from "@/lib/types/audit";
import { logger } from "@/lib/observability/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("audits") as any)
      .select("public_snapshot, metadata")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      logger.warn("Audit not found for summary generation", { slug });
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    const metadata = data.metadata as Record<string, unknown>;
    const snapshot = data.public_snapshot as unknown as PublicAuditSnapshot;

    // 2. Check if summary already exists
    if (metadata?.aiSummary) {
      return NextResponse.json(
        { summary: metadata.aiSummary },
        { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } }
      );
    }

    // 3. Generate summary async
    const { summary, status } = await generateAuditSummary(snapshot);

    // 4. Save the summary back to the database to prevent regenerating
    const updatedMetadata = { ...metadata, aiSummary: summary };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("audits") as any)
      .update({ metadata: updatedMetadata })
      .eq("slug", slug);

    // 4.5 Track Analytics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: auditRecord } = await (supabase.from("audits") as any).select("id").eq("slug", slug).single();
    if (auditRecord) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("events") as any).insert({
        event_type: status,
        audit_id: auditRecord.id,
      });
      logger.metric("AI summary completed", { auditId: auditRecord.id, status });
    }

    return NextResponse.json(
      { summary },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } }
    );
  } catch (error) {
    logger.error("Error generating AI summary", { error });
    // Even if it fails, we want to return a deterministic fallback
    // The generateAuditSummary already handles this, but just in case:
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
