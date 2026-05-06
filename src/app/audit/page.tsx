import type { Metadata } from "next";
import Link from "next/link";
import { SpendForm } from "@/components/audit/spend-form";

export const metadata: Metadata = {
  title: "Audit Your AI Stack — StackTrim",
  description:
    "Enter your AI tools, plans, and team size to get a free spend audit with actionable savings recommendations.",
};

export default function AuditPage() {
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
            Free AI Spend Audit
          </span>
        </div>
      </nav>

      {/* Audit Form */}
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
          <div className="mb-10">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Audit your AI stack
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Add the AI tools your team uses. We&apos;ll analyze your spend
              against real pricing data and find savings opportunities.
            </p>
          </div>

          <SpendForm />
        </div>
      </main>
    </div>
  );
}
