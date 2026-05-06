# Testing Strategy

## Philosophy

Tests exist to protect the highest-risk parts of the product. For StackTrim, that's the **audit engine** — if the financial math is wrong, every recommendation is wrong, and user trust is destroyed.

## Current Coverage (Day 1)

### Catalog Tests (`src/tests/engine/catalog.test.ts`)
- Data integrity: all tools have unique IDs, valid categories, non-negative pricing
- Structural: plans ordered cheapest → most expensive
- Lookup helpers: `getToolById`, `getPlanForTool`, `getToolsByCategory`

### Analyzer Tests (`src/tests/engine/analyzer.test.ts`)
- Seat rightsizing detection (excess seats flagged correctly)
- Plan downgrade recommendations (threshold logic)
- Credit program flagging
- Edge cases: no tools, unknown tools, lowest-tier plans
- Result structure validation (ID format, sorting, aggregation)

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
