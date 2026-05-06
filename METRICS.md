# Metrics

## North Star Metric

**Qualified leads generated for Credex per month.**

A qualified lead = a user who:
1. Completed an audit
2. Had at least one actionable recommendation
3. Provided their email

## Key Performance Indicators

### Acquisition
| Metric | Definition | Target |
|--------|-----------|--------|
| Landing page visits | Unique visitors to `/` | Track growth |
| Audit start rate | Visits → `/audit` page | >25% |
| Audit completion rate | Form submitted / form started | >60% |

### Activation
| Metric | Definition | Target |
|--------|-----------|--------|
| Avg savings found | Mean `totalMonthlySavings` per audit | >$100/mo |
| Avg recommendations | Mean recommendations per audit | >2 |
| Savings percentage | Mean `savingsPercentage` | >15% |

### Engagement
| Metric | Definition | Target |
|--------|-----------|--------|
| Email capture rate | Emails collected / audits completed | >30% |
| PDF download rate | PDFs downloaded / audits completed | >15% |
| Share rate | Share URLs created / audits completed | >5% |

### Revenue (Credex)
| Metric | Definition | Target |
|--------|-----------|--------|
| Qualified leads/month | See definition above | 10+ |
| Lead → Credex conversion | Leads that become Credex customers | Track |

## Instrumentation Plan

### Day 1 (Current)
- None — no analytics yet. Focus on building.

### Day 2
- Basic event tracking (page views, form starts, form completions)
- Audit result metrics (savings found, recommendations generated)

### Day 3+
- Full funnel analytics
- Cohort analysis
- A/B testing framework for landing copy

## Anti-Metrics

Things we explicitly do NOT optimize for:
- **Time on site** — We want users to get results fast, not browse
- **Page views** — Depth doesn't matter, completion does
- **Signup count** — Signups without audit completion are vanity metrics
