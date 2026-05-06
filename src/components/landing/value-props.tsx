import { Search, TrendingDown, Zap } from "lucide-react";

const PROPS = [
  {
    icon: Search,
    title: "Audit your AI stack",
    description:
      "Enter the tools you use, your plans, team size, and monthly spend. We map everything against real pricing data.",
  },
  {
    icon: TrendingDown,
    title: "Find real savings",
    description:
      "Discover overpaying, unused seats, downgrade opportunities, and credit programs you didn't know existed.",
  },
  {
    icon: Zap,
    title: "Act with confidence",
    description:
      "Every recommendation is backed by deterministic math and real pricing. No AI decides your numbers.",
  },
] as const;

export function ValueProps() {
  return (
    <section className="border-t border-border/60 bg-secondary/30">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            How it works
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Three steps. No onboarding. No credit card.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {PROPS.map((prop, i) => (
            <div key={i} className="group relative">
              {/* Step number */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background shadow-sm transition-colors group-hover:border-foreground/20">
                  <prop.icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="text-sm font-semibold">{prop.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
