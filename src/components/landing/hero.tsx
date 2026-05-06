import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,hsl(0_0%_91%/0.5)_1px,transparent_1px),linear-gradient(to_bottom,hsl(0_0%_91%/0.5)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-20%,hsl(220_70%_95%),transparent)]" />

      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-2xl text-center">
          {/* Eyebrow */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/60 px-3 py-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-savings" />
            <span className="text-xs font-medium text-muted-foreground">
              Free AI spend audit — no signup required
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Find wasted AI spend
            <br />
            <span className="text-muted-foreground">
              before your next invoice.
            </span>
          </h1>

          {/* Subtext */}
          <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Enter your AI tools and subscriptions. Get a deterministic audit
            with real savings opportunities — no guesswork, no AI
            hallucinations, no sales calls.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button render={<Link href="/audit" />} nativeButton={false} size="lg" className="gap-2 px-6">
              Audit Your Stack
              <ArrowRight className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              Results in 60 seconds · 100% free
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
