# 0004 - Human Approval For Risky Actions

## Title

Require human approval for risky actions and review-required graph ingestion.

## Status

Accepted

## Context

EV-KOS includes autonomous agents, publishing flows, executive operations, graph ingestion, and governance systems. Some actions are low-risk proposals. Others can publish content, mutate durable memory, send external communications, affect business operations, or pollute canonical graph state.

## Decision

Human approval is required for risky actions. This includes review-required semantic graph ingestion, blocked or low-confidence graph candidates, external execution, publication-impacting actions, irreversible deletes, financial changes, and executive operations that cross safe automation boundaries.

Automation may propose plans and dry-run outputs. Humans approve risky execution.

## Consequences

- Future Phase 4C writes must enforce approval for `REQUIRES_REVIEW`.
- `BLOCK` remains non-executable.
- Agents cannot bypass approval by calling lower-level write services.
- Publishing and graph mutation remain governed and auditable.
- The system can become more autonomous without removing human accountability.

## Alternatives considered

- Allow agents to write directly when confidence is high: rejected because confidence alone is not governance.
- Require approval for every action: rejected because it would block useful low-risk automation.
- Treat graph writes as internal and safe: rejected because graph quality affects future reasoning and publishing.

## Date

2026-06-26
