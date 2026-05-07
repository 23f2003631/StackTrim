# Testing Strategy

## Philosophy

Tests exist to protect the highest-risk parts of the product. For StackTrim, that's the **audit engine** — if the financial math is wrong, every recommendation is wrong, and user trust is destroyed.

## Current Coverage (Day 2)

We now have **126 automated tests** enforcing the rules of the engine.

### Calculation Tests (`src/tests/engine/calculations.test.ts`)
- Financial rounding, period conversions (monthly/annual)
- Seat costs, excess seat calculations
- Conservative consolidation bounds (Math.min)
- Formula text builders (transparency checks)

### Confidence Tests (`src/tests/engine/confidence.test.ts`)
- Factor-based scoring generation (verified pricing, exact plans)
- Confidence assignment mappings (High/Medium/Low)
- Pricing staleness checks (90-day threshold)

### Snapshot Tests (`src/tests/engine/snapshot.test.ts`)
- PII Sanitization (stripping email, company name, notes, exact toolIds)
- Privacy verification (defense-in-depth JSON inspection)
- Preservation of aggregate financial values

### Analyzer Tests (`src/tests/engine/analyzer.test.ts`)
- Seat rightsizing detection (excess seats flagged correctly)
- Plan downgrade recommendations (15% threshold logic)
- Cross-tool consolidation (overlap detection)
- "Keep" recommendations (already-optimized states)
- Result structure validation (ID format, priorities, totals)

### Catalog Tests (`src/tests/engine/catalog.test.ts`)
- Data integrity: unique IDs, valid categories, non-negative pricing
- Expanded models: `pricingModel`, `vendor`, alternatives
- Lookups: `getCheapestPaidPlan`, `getAlternatives`

## Test Commands

```bash
# Run all tests
npx vitest run

# Run with UI
npx vitest --ui

# Run in watch mode
npx vitest

# Run specific test file
npx vitest run src/tests/engine/catalog.test.ts
```

## Future Testing Priorities

| Priority | Area | Why |
|----------|------|-----|
| P0 | Audit engine math | Financial accuracy is product credibility |
| P0 | Zod validation schemas | Invalid input = bad recommendations |
| P1 | API routes | Server-side input validation |
| P1 | Form UX | Ensure form→engine→results flow works |
| P2 | Landing page | Visual regression (consider Playwright) |
| P3 | Email capture | Integration test with Supabase |

## CI Pipeline

Tests run automatically on every push and PR via GitHub Actions:
```
Lint → Type Check → Vitest → Build
```

Any failure blocks the pipeline. No broken code reaches `main`.
