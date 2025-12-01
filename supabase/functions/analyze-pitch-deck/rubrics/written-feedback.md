# Written Feedback Framework

## Overview

Provide written feedback on both:

1. **Deck Feedback** — How well the pitch deck communicates
2. **Startup Feedback** — How strong the underlying business appears

Feedback should be direct, specific, actionable, and stage-appropriate.

---

## Deck Feedback

Evaluates the pitch deck as a communication vehicle—clarity, structure, flow, and persuasiveness—independent of the underlying business quality.

### Structure

| Component | Length | Purpose |
|-----------|--------|---------|
| Executive Summary | Maximum 3 sentences | Overall deck quality and key takeaway |
| Strengths | 2-3 items, maximum 2 sentences each | What the deck does well |
| Weaknesses | 2-3 items, maximum 3 sentences each | What needs improvement (with severity) |
| Priority Actions | 2-3 items, maximum 2 sentences each | Most important changes to make |

### Output Format

**Executive Summary:** Provide an overall assessment, the biggest strength, and the biggest gap or opportunity.

**Strengths:**
```json
{
  "title": "Short descriptor",
  "description": "Specific explanation with evidence from deck"
}
```

**Weaknesses:**
```json
{
  "title": "Short descriptor",
  "description": "Specific explanation of the issue and its impact",
  "severity": "critical | high | medium"
}
```

**Priority Actions:** Numbered list of 2-3 specific, actionable changes, ordered by impact.

---

## Startup Feedback

Evaluates the underlying business based on what can be assessed from the deck—team, market, traction, product, defensibility, and fundability.

**Critical Distinction:** Startup feedback evaluates the BUSINESS quality, not the deck presentation. Do not reference missing slides, presentation issues, or what the deck fails to show. Focus only on the underlying business: team capability, market opportunity, product strength, traction quality, and fundability. If information is missing, evaluate based on what IS presented, not what isn't.

### Structure

| Component | Length | Purpose |
|-----------|--------|---------|
| Executive Summary | Maximum 3 sentences | Overall startup quality and investment readiness |
| Strengths | 2-3 items, maximum 2 sentences each | What's compelling about this business |
| Concerns | 2-3 items, maximum 3 sentences each | Key risks or gaps (with severity) |

### Output Format

**Executive Summary:** Provide an overall investment readiness assessment, the most compelling element, and the biggest question or risk. If scores are polarized (e.g., strong team but weak traction), call out the trade-off explicitly.

**Strengths:**
```json
{
  "title": "Short descriptor",
  "description": "Specific explanation with evidence from deck"
}
```

**Concerns:**
```json
{
  "title": "Short descriptor",
  "description": "Specific explanation of the risk and why it matters",
  "severity": "critical | high | medium"
}
```

---

## Severity Definitions

| Severity | Meaning |
|----------|---------|
| Critical | Likely a deal-breaker for most investors at this stage; fix before sending any decks |
| High | Significant concern that weakens the deck/business; must be addressed |
| Medium | Notable issue but not fatal; improve when possible |

---

## Stage Calibration

Calibrate all feedback to the appropriate stage. What constitutes a concern at Series A may be entirely normal at Pre-Seed.

- **Pre-Seed:** Traction may be user interviews, pilots, or waitlists rather than revenue. Focus on clarity, honesty, and evidence of customer discovery.
- **Seed:** Expect paying customers, early retention signals, and emerging GTM motion. Push harder on metrics and repeatability.
- **Series A:** Expect fully formed traction, unit economics, proven GTM, and clear path to next stage.

---

## Key Distinctions

- **Deck vs. Startup feedback:** Deck feedback evaluates communication and presentation. Startup feedback evaluates the underlying business. Keep these separate—a startup concern should be about business risk, not slide design.
- **Priority actions flow from weaknesses:** The actions should directly address the weaknesses identified, ordered by impact.
- **Flag exceptional performance:** If something is genuinely exceptional for the stage (e.g., ARR, retention, founder track record), explicitly call it out so founders understand they're ahead of typical benchmarks.

---

## Tone Principles

- Be direct and honest
- Be specific—reference actual slides, metrics, or content
- Be constructive—don't just identify problems, give direction
- Acknowledge uncertainty—don't claim to know things that can't be assessed from a deck
- **Use UK English spelling throughout all outputs** (e.g., analyse, organisation, colour, behaviour, centre, licence)

## Length Constraints

All category reasoning in Deck Breakdown and Startup Breakdown: **Maximum 2 sentences each**
