import Link from "next/link";
import { ArrowRight, Shield, Clock, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TRUST_SIGNALS } from "@/lib/constants";

const ICONS = [Shield, Clock, Calculator] as const;

export function CtaSection() {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
        {/* Trust signals */}
        <div className="grid gap-6 sm:grid-cols-3">
          {TRUST_SIGNALS.map((signal, i) => {
            const Icon = ICONS[i];
            return (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-4"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{signal.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {signal.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to find your savings?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Most teams find 15-30% savings on their AI tooling. Takes less than
            2 minutes.
          </p>
          <div className="mt-8">
            <Button render={<Link href="/audit" />} size="lg" className="gap-2 px-6">
              Start Free Audit
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
