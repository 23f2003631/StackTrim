# Reflection

## Why StackTrim?

The Credex assignment tests whether a candidate can think like a founder-engineer. The product needed to:
1. Demonstrate real product thinking (not just technical execution)
2. Serve a genuine pain point in Credex's target market
3. Be technically sound enough to ship

AI spend waste is a real, quantifiable problem for startups. Most teams pay for overlapping tools, unused seats, and premium tiers they don't need. This isn't a hypothetical — it's a pattern I've seen repeatedly.

## Design Tradeoffs

### Determinism vs. AI flexibility

I chose deterministic financial logic despite the temptation to use LLMs for "smarter" recommendations. Reasons:
- CTOs won't trust savings numbers from a model that hallucinates
- Deterministic outputs are testable — every recommendation can be verified against catalog data
- AI summary (future) sits on TOP of deterministic results, never replaces them

### Client-side vs. server-side engine

For Day 1, the audit engine runs entirely client-side. This is intentional:
- Zero latency — results appear instantly
- No backend infrastructure needed
- The engine is pure functions — moving it server-side later is a simple import change

The tradeoff is no persistence. That's acceptable for Day 1 — persistence comes with Supabase in Day 2.

### shadcn/ui vs. building from scratch

shadcn/ui gives me accessible, type-safe components without a runtime dependency. I own the code, I can customize it, and it looks premium out of the box. The time saved went into engine logic and testing instead.

## What I'd do differently with more time

1. **More comprehensive pricing catalog** — 10 tools is a start; 30+ would make the product genuinely useful
2. **Usage pattern analysis** — Ask users about frequency/intensity, not just seats
3. **Consolidation detection** — Identify when two tools serve the same purpose
4. **Competitive benchmarking** — "Teams your size typically spend X on AI tools"

## Honest limitations

- Pricing data is a snapshot — it goes stale without a maintenance process
- The engine can't analyze usage-based pricing (API costs) without usage data
- Seat rightsizing assumes 1 seat per team member, which isn't always true
- No qualitative assessment of whether a tool is actually providing value

## What makes this project different

This isn't a CRUD app with AI sprinkled on top. It's a product with:
- A clear ICP and value proposition
- A trust-first architecture (value before capture)
- Testable, deterministic core logic
- Documentation that reflects real engineering thinking