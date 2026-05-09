import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { PublicAuditSnapshot } from "@/lib/types/audit";
import { PrintAuditView } from "@/components/audit/print-audit-view";

export default async function PrintPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("audits") as any)
    .select("public_snapshot, metadata, created_at")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    notFound();
  }

  const snapshot = data.public_snapshot as unknown as PublicAuditSnapshot;
  const aiSummary = (data.metadata as Record<string, unknown>)?.aiSummary as string | null;
  const createdAt = data.created_at as string;

  return <PrintAuditView snapshot={snapshot} slug={slug} aiSummary={aiSummary} createdAt={createdAt} />;
}
