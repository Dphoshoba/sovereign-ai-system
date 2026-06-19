# Echoes & Visions AI Content Operating Manual

## Version

Phase 4.5 Production Operations Manual

---

# System Purpose

The Echoes & Visions platform is designed to:

* Discover content opportunities
* Research topics using external sources
* Generate draft articles
* Score editorial quality
* Produce research audits
* Queue content for human review
* Publish only after approval

The system is intentionally designed to prevent autonomous publishing.

All generated content must pass through human review.

---

# Core Content Pipeline

```text
Brave Search
    ↓
Topic Discovery
    ↓
Opportunity Scoring
    ↓
Discovery Queue
    ↓
Article Generation
    ↓
Research Audit
    ↓
Editorial Review
    ↓
Approval
    ↓
Publishing
```

---

# Daily Operating Flow

## Automated Discovery Cycle

Scheduler runs:

```text
run_discovery_cycle
```

Frequency:

```text
Daily
```

Process:

1. Discover topics
2. Score opportunities
3. Save new opportunities
4. Generate approved number of articles
5. Create research audit
6. Set article status

```text
review-required
```

---

# Discovery Queue

Location:

```text
Admin → Discovery Queue
```

Purpose:

* Review discovered opportunities
* Generate articles manually
* Track generated content

Statuses:

```text
discovered
researching
generated
rejected
```

---

# Research Pipeline

Research process:

```text
Source Collection
    ↓
Evidence Registry
    ↓
Fact Extraction
    ↓
Verification
    ↓
Consensus Analysis
    ↓
Research Audit
```

Goals:

* Reduce hallucinations
* Improve source quality
* Improve factual accuracy
* Provide audit transparency

---

# Editorial Workflow

Every generated article begins as:

```text
review-required
```

Never:

```text
published
```

Automatically.

Human review is mandatory.

Review Checklist:

* Accuracy
* Clarity
* SEO quality
* Internal linking
* Brand alignment
* Citation quality

---

# Publishing Workflow

Only approved content can become:

```text
scheduled
```

or

```text
published
```

Publishing checks:

* Research audit exists
* Editorial review complete
* Approval recorded

---

# Research Audit Interpretation

Key Metrics:

## Research Confidence

Measures overall confidence level.

Target:

```text
70+
```

## Authority Score

Measures source authority.

Target:

```text
60+
```

## Trust Score

Measures source trustworthiness.

Target:

```text
70+
```

## Verification Score

Measures evidence verification quality.

Target:

```text
70+
```

## Consensus Score

Measures agreement between sources.

Target:

```text
70+
```

---

# Scheduler Operations

Current automated operation:

```text
Daily Discovery Cycle
```

Operation Type:

```text
run_discovery_cycle
```

Duplicate schedules are prevented.

---

# Recovery Procedures

## Discovery Stops Running

Check:

```text
/api/ai/scheduler
```

Verify:

```text
status = active
```

Run manually:

```text
/api/ai/scheduler/run
```

Then:

```text
/api/ai/jobs/run
```

---

## Discovery Queue Empty

Run:

```text
/api/discovery/scheduled-run
```

Verify:

```text
Brave API key
SEARCH_PROVIDER=brave
```

---

## Articles Not Generating

Verify:

```text
Topic Status
```

Must be:

```text
discovered
```

Check:

```text
/api/discovery/run-queue
```

---

## Research Audit Missing

Verify:

```text
Research pipeline enabled
```

Check:

```text
ResearchAudit table
```

---

# Environment Variables

Required:

```env
DATABASE_URL=
DIRECT_URL=
OPENAI_API_KEY=
BRAVE_SEARCH_API_KEY=
SEARCH_PROVIDER=brave
NEXT_PUBLIC_APP_URL=
```

---

# Deployment Checklist

Before Production Deploy:

* npm run build
* Prisma schema synced
* Scheduler operational
* Discovery queue operational
* Research audits generated
* Review workflow functional
* Publishing workflow verified
* Duplicate schedule prevention active

---

# Governance Rules

Never auto-publish.

Never bypass review-required.

Never remove research auditing.

Never fabricate facts, sources, companies, statistics, or quotes.

Human review remains the final approval gate.

---

# Current System Status

Completed:

* Phase 1 Governance
* Phase 2 Research Pipeline
* Phase 2.5 Audit Persistence
* Phase 3 Editorial Workflow
* Phase 4.1 Topic Discovery
* Phase 4.2 Queue Engine
* Phase 4.3 Autonomous Discovery
* Phase 4.4 Scheduler Integration
* Phase 4.5 Operations Manual

Platform Status:

```text
Production Ready
Human Review Required
```
