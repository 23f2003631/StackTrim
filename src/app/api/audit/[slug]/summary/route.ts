import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateAuditSummary } from "@/lib/ai/summary";
import { PublicAuditSnapshot } from "@/lib/types/audit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createAdminClient();

    // 1. Fetch the audit
    const { data, error } = await supabase
      .from("audits")
      .select("public_snapshot, metadata")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    const metadata = data.metadata as any;
    const snapshot = (data as any).public_snapshot as unknown as PublicAuditSnapshot;

    // 2. Check if summary already exists
    if (metadata?.aiSummary) {
      return NextResponse.json({ summary: metadata.aiSummary });
    }

    // 3. Generate summary async
    const summary = await generateAuditSummary(snapshot);

    // 4. Save the summary back to the database to prevent regenerating
    const updatedMetadata = { ...metadata, aiSummary: summary };
    await supabase
      .from("audits")
      .update({ metadata: updatedMetadata })
      .eq("slug", slug);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error generating AI summary:", error);
    // Even if it fails, we want to return a deterministic fallback
    // The generateAuditSummary already handles this, but just in case:
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
