import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { PublicAuditSnapshot } from "@/lib/types/audit";
import { AuditResults } from "@/components/audit/audit-results";

export const metadata: Metadata = {
  title: "Audit Result — StackTrim",
  description: "View the results of your AI stack audit.",
};

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data, error, status } = await supabase
    .from("audits")
    .select("public_snapshot")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.error("SharePage error fetching audit:", { slug, error, status });
    notFound();
  }

  const snapshot = (data as any).public_snapshot as unknown as PublicAuditSnapshot;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
              <span className="text-xs font-bold text-background">ST</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">
              StackTrim
            </span>
          </Link>
          <span className="text-xs text-muted-foreground">
            Audit Result
          </span>
        </div>
      </nav>

      {/* Audit Results */}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
          <AuditResults result={snapshot} slug={slug} />
        </div>
      </main>
    </div>
  );
}
