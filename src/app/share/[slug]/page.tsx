import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { PublicAuditSnapshot } from "@/lib/types/audit";
import { AuditResults } from "@/components/audit/audit-results";
import { Shield } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("audits") as any)
    .select("public_snapshot")
    .eq("slug", slug)
    .single();

  if (!data) {
    return {
      title: "Audit Not Found — StackTrim",
    };
  }

  const snapshot = data.public_snapshot as unknown as PublicAuditSnapshot;
  const savings = formatCurrency(snapshot.totalAnnualSavings);

  return {
    title: `${savings}/yr in AI savings identified — StackTrim`,
    description: `StackTrim identified ${formatCurrency(snapshot.totalMonthlySavings)}/mo in savings across ${snapshot.toolNames.length} AI tools. Deterministic audit powered by public pricing data.`,
    openGraph: {
      title: `${savings}/yr in AI savings identified`,
      description: `Deterministic AI spend audit across ${snapshot.toolNames.length} tools.`,
      type: "article",
      siteName: "StackTrim",
    },
    twitter: {
      card: "summary_large_image",
      title: `${savings}/yr in AI savings identified — StackTrim`,
      description: `Deterministic AI spend audit across ${snapshot.toolNames.length} tools.`,
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, status } = await (supabase.from("audits") as any)
    .select("public_snapshot")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.error("SharePage error fetching audit:", { slug, error, status });
    notFound();
  }

  const snapshot = data.public_snapshot as unknown as PublicAuditSnapshot;

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

      {/* Trust Footer for Share Pages */}
      <footer className="border-t border-border/40 py-6">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>Public links never expose private company details.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
