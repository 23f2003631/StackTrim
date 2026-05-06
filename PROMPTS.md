# AI Usage & Prompts

## Transparency

This project uses AI assistance in development. This document logs how AI was used, in the interest of honesty and transparency.

## Usage Policy

- ✅ **AI may assist with:** code generation, boilerplate, documentation drafts, debugging
- ✅ **AI may generate (future):** personalized summary paragraphs on audit results
- ❌ **AI never decides:** pricing data, savings calculations, financial recommendations
- ❌ **AI never generates:** audit results, catalog data, recommendation logic

## AI Usage Log

### Day 1

| Area | How AI Was Used |
|------|-----------------|
| Scaffolding | Project setup, file structure generation |
| Components | UI component code generation (landing page, form, results) |
| Types | Domain type definitions (with human review) |
| Tests | Test case generation (with human validation of assertions) |
| Documentation | Markdown file drafts (with human editing) |
| Pricing data | **Not used** — all prices manually sourced from vendor pages |
| Engine logic | **Not used** — all financial logic written with explicit human review |

## Future AI Integration

The product will use AI for one specific purpose:

**Personalized audit summary** — After the deterministic engine generates recommendations, an LLM will write a 2-3 sentence natural language summary. This is clearly separated from the financial logic and labeled as AI-generated.

Architecture:
```
Deterministic Engine → AuditResult → AI Summary Generator → Summary Paragraph
                                     (clearly labeled as AI-generated)
```

The summary never influences recommendations, savings numbers, or confidence levels.
