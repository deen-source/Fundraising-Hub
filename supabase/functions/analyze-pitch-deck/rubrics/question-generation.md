# Investor Question Generation Framework

## Overview

Generate exactly 5 questions investors will likely ask, based on:

1. **Gaps in the deck** — Missing slides or information
2. **Unclear communication** — Points requiring clarification
3. **Claims requiring validation** — Statements without evidence
4. **Criteria scored Low (0-4)** — Weak areas in startup assessment
5. **Criteria unassessable from deck** — Important factors requiring conversation

**Format Requirement:** Each question must be a single, focused question — no compound questions with multiple sub-parts or follow-up questions bundled together. One question mark per question. Maximum 2 sentences per question.

---

## Question Selection Logic

### Priority Order

Select questions in this priority order until you have 5:

1. **Critical gaps** — Essential information missing for the stage
2. **Low-scoring criteria** — Areas scoring 0-4 in startup assessment
3. **Unvalidated claims** — Bold statements without evidence
4. **Unclear communication** — Key points that need clarification
5. **Unassessable criteria** — Important factors that can't be evaluated from a deck

When choosing between multiple possible questions at the same priority level, prefer questions where the answer would meaningfully change an investor's decision, conviction, or valuation over "nice to know" detail.

### Stage Calibration

For earlier or low-data companies within a stage, prefer question variants that ask "how are you thinking about X?" rather than presuming a fully mature metric.

Stage-appropriate expectations:
- **Pre-Seed:** Focus on founder insight, problem validation, early customer signals
- **Seed:** Focus on traction quality, retention signals, GTM motion emergence
- **Series A:** Focus on scalability, unit economics, path to Series B

---

## Distribution Guidelines

- Aim for coverage across categories; avoid 3+ questions from the same area unless gaps are severe
- Before finalising the 5 questions, check for overlap and remove or merge questions that ask essentially the same thing
- Don't ask Series A questions of Pre-Seed companies

---

## Unassessable Criteria

These cannot be evaluated from a deck and should be drawn from if other triggers don't fill 5 questions:

| Criterion | What it probes |
|-----------|----------------|
| Founder resilience | How they handle adversity and setbacks |
| Team dynamics | Decision-making process and co-founder relationship |
| Learning velocity | How quickly they iterate based on feedback |
| Customer depth | Quality and depth of customer relationships |
| Sales capability | Actual sales process and loss analysis |
| Reference quality | Which customers would vouch for them |
| Coachability | How they respond to investor feedback |
| Hiring & team building | Quality and process of recent hires |
| Org health | Attrition, culture, team morale |
| GTM execution | Actual sales process beyond what's presented |
| Retention quality | Which customers are at risk and why |

Generate questions dynamically based on these themes rather than using fixed question text.

---

## Question Quality Standards

Good questions are:
- **Specific** — Reference actual content from the deck
- **Decision-relevant** — The answer would change investment conviction
- **Open-ended** — Invite narrative response, not yes/no
- **Stage-appropriate** — Calibrated to reasonable expectations for the stage

Avoid:
- Questions already answered in the deck
- Leading questions that assume a problem
- Multiple questions bundled into one
- Generic questions that could apply to any startup
