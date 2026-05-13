# PROMPTS.md

# AI Usage & Prompts

## Transparency

This project uses AI assistance during development. This document records how AI was used so the architecture, code quality, and product decisions remain transparent.

AI was used as a productivity and review aid, not as an authority for financial logic, pricing, or recommendations.

## Usage Policy

### AI may assist with:
- code scaffolding
- boilerplate generation
- documentation drafts
- debugging hypotheses
- UI copy variants
- test case brainstorming
- prompt iteration
- accessibility and UX review
- summarizing deterministic audit results in natural language

### AI must never:
- decide pricing
- invent savings numbers
- generate audit recommendations
- choose confidence levels
- replace deterministic audit logic
- fabricate user interviews
- override official vendor pricing sources

### Hard boundary
All financial analysis in StackTrim is deterministic and rule-based.  
AI is only allowed to describe the result after the audit engine has finished.

---

## How AI Was Used in This Project

### Day 1 — Project setup and scaffolding
AI was used to help generate:
- initial folder structure
- landing page scaffolding
- reusable UI component structure
- initial markdown file templates
- early type definitions

Human review was used for:
- final architectural decisions
- naming
- product positioning
- pricing data collection

### Day 2 — Audit engine and pricing architecture
AI was used to help brainstorm:
- type shapes
- rule organization
- test case ideas
- code cleanup suggestions

AI was not used for:
- pricing values
- savings formulas
- recommendation logic
- confidence scoring decisions

### Day 3 — Form flow and results UX
AI helped with:
- component structure
- loading states
- result page copy options
- state management patterns

Human review ensured:
- audit result logic stayed deterministic
- public/private data separation stayed intact
- UX stayed premium and clear

### Day 4 — Lead capture and email flow
AI helped with:
- route handler structure
- validation ideas
- email template drafts
- fallback/error handling patterns

Human review ensured:
- lead capture happened after value
- email sending never blocked the audit
- failures degraded gracefully

### Day 5 — PDF, OG, and presentation polish
AI helped with:
- layout ideas
- README structure
- print-flow reasoning
- metadata wording
- screenshot-friendly copy

Human review ensured:
- launch-quality polish
- trust-oriented UX
- no excessive motion or gimmicks

### Day 6 — Analytics, observability, and product storytelling
AI helped with:
- analytics event ideas
- README and documentation refinement
- internal insight structure
- security/checklist brainstorming

Human review ensured:
- analytics stayed lightweight
- docs stayed specific and honest
- product narrative stayed founder-focused

### Day 7 — Final hardening and submission readiness
AI helped with:
- final documentation polish
- deployment checklist structure
- recruiter-facing phrasing
- final review of tradeoffs and edge cases

Human review ensured:
- repository quality
- final consistency
- submission readiness

---

## AI Prompt Archive

### 1) Core product architecture prompt
Used to guide the AI editor in understanding the full assignment and building StackTrim as a finance-grade AI spend audit product.

Key constraints included:
- no login before value
- deterministic audit math
- public share pages without private details
- AI only for summary text
- PDF export
- lead capture after audit
- real backend persistence

### 2) Audit summary prompt
Used to generate the personalized AI summary paragraph shown after a deterministic audit.

Rules:
- only use the provided audit JSON
- do not invent numbers
- do not override recommendations
- keep the tone calm and operational
- keep the summary short and useful

### 3) Fallback summary prompt
Used when the AI summary service fails or times out.

Rules:
- never block the audit result page
- return a deterministic templated summary
- preserve a trustworthy tone
- avoid mentioning internal failure details to users

### 4) Documentation and reflection prompts
Used to help structure:
- README.md
- ARCHITECTURE.md
- DEVLOG.md
- REFLECTION.md
- GTM.md
- ECONOMICS.md
- USER_INTERVIEWS.md

These prompts were used to improve clarity, specificity, and reviewer readability, not to fabricate content.

---

## What AI Was Not Trusted With

AI was explicitly not trusted with:
- official pricing data
- audit savings math
- recommendation selection
- confidence scoring
- user interview fabrication
- security decisions
- deployment secrets
- final product positioning without human review

Any AI suggestion touching those areas was checked manually before implementation.

---

## Example Prompt Boundary for Audit Summaries

The following pattern was used for AI-generated summaries:

```text
You are given a deterministic audit result for a startup AI spend analysis tool.

Write a concise 2–3 sentence summary.
Use only the provided JSON.
Do not invent savings, prices, tools, or recommendations.
Do not change the financial meaning of the audit.
Keep the tone calm, operational, and founder-friendly.
If uncertainty exists, mention it briefly and conservatively.