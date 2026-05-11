# StackTrim Demo Scenarios

This document outlines pre-configured scenarios designed for recruiter walkthroughs, Loom demonstrations, and portfolio showcases. These scenarios highlight StackTrim's deterministic engine, AI fallback handling, and operational maturity.

## Scenario A: The High-Spend Startup
**Objective:** Demonstrate maximum value realization and the "Top Opportunities" progressive disclosure.

**Inputs:**
- **Team Size:** 85
- **Tool Stack:**
  - `Linear` (High usage)
  - `Notion` (High usage)
  - `Asana` (Overlapping)
  - `Jira` (Overlapping)
  - `GitHub Copilot`
  - `Cursor` (Overlapping)
  - `Vercel` (High usage)
  - `AWS` (Unmanaged spend)

**Expected Output:**
- The engine will aggressively flag `Jira` + `Asana` + `Linear` as an overlapping cluster and recommend consolidating to Linear to save per-seat costs.
- `Cursor` and `Copilot` will be flagged as overlapping AI code assistants.
- **AI Summary:** Should synthesize these 3 high-impact recommendations into a professional, financially credible executive summary.
- **Top Opportunity:** "Eliminate Asana" or "Eliminate Jira" will surface as the highest impact move.

---

## Scenario B: The Lean, Optimized Team
**Objective:** Demonstrate the conservative, trust-first nature of the engine (i.e., we do not hallucinate savings).

**Inputs:**
- **Team Size:** 12
- **Tool Stack:**
  - `Linear`
  - `Cursor`
  - `Vercel`

**Expected Output:**
- **Savings Identified:** $0
- **AI Summary (Optimized Path):** The system should intelligently congratulate the team on a highly optimized stack rather than forcing a recommendation.
- **Insight Banner:** "Top 10% Optimized Stack" banner should appear.

---

## Scenario C: The AI Failure (Graceful Degradation)
**Objective:** Demonstrate operational resilience and fallback boundaries when third-party services fail.

**How to test:**
1. Open `.env.local` and temporarily remove or break the `GEMINI_API_KEY`.
2. Run an audit for a medium-spend stack (e.g., 5 tools with 1 overlap).
3. Observe the results page.

**Expected Output:**
- The UI should not break.
- The summary block will still render securely, utilizing the `generateFallbackSummary` logic to inject a deterministic, non-AI summary into the exact same UI component.
- The `events` table will securely track `ai_summary_missing_key` instead of `ai_summary_generated`, demonstrating mature observability.
