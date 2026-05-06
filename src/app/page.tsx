import Link from "next/link";
import { Hero } from "@/components/landing/hero";
import { ValueProps } from "@/components/landing/value-props";
import { CtaSection } from "@/components/landing/cta-section";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
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
          <Link
            href="/audit"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Start Audit →
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Hero />
        <ValueProps />
        <CtaSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} StackTrim. Built for{" "}
              <a
                href="https://credex.money"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Credex
              </a>
              .
            </p>
            <p className="text-xs text-muted-foreground">
              Pricing data verified May 2026. No AI decides your savings.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
