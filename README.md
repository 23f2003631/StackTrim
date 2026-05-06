# StackTrim

**Find wasted AI spend before your next invoice.**

StackTrim is a B2B SaaS audit platform that analyzes startup spending on AI tools and infrastructure subscriptions. Users enter their AI stack — tools, plans, team size, seats — and receive deterministic, explainable savings recommendations backed by real pricing data.

Built for the [Credex](https://credex.money) internship assignment.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npx vitest run

# Type check
npx tsc --noEmit

# Build for production
npm run build
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design details.

**Tech Stack:**
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- React Hook Form + Zod validation
- Vitest for testing
- Deterministic audit engine (no AI in financial logic)

**Key Directories:**
```
src/
  app/              → Pages (App Router)
  components/       → React components
    landing/        → Landing page sections
    audit/          → Audit form & results
    ui/             → shadcn/ui primitives
  lib/
    engine/         → Audit analysis engine + pricing catalog
    types/          → TypeScript domain types
    validations/    → Zod schemas
  tests/            → Vitest test suites
```

## Core Principle

> **AI never decides pricing, savings, or recommendations.** Every financial calculation is deterministic, based on publicly available pricing data. AI is only used (in future) to generate a short personalized summary paragraph.

## Development

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type checking |
| `npx vitest run` | Run all tests |
| `npx vitest --ui` | Test UI |

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design & data flow
- [DEVLOG.md](./DEVLOG.md) — Daily development log
- [TESTS.md](./TESTS.md) — Testing strategy
- [PRICING_DATA.md](./PRICING_DATA.md) — Pricing data sourcing
- [REFLECTION.md](./REFLECTION.md) — Design decisions & tradeoffs
- [GTM.md](./GTM.md) — Go-to-market strategy
- [ECONOMICS.md](./ECONOMICS.md) — Unit economics
- [PROMPTS.md](./PROMPTS.md) — AI usage transparency
- [METRICS.md](./METRICS.md) — Success metrics
- [USER_INTERVIEWS.md](./USER_INTERVIEWS.md) — User research
- [LANDING_COPY.md](./LANDING_COPY.md) — Messaging strategy

## License

Private — built for Credex evaluation.
