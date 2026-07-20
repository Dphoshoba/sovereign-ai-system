# Knowledge Health Agent

| Attribute | Value |
|---|---|
| Agent ID | `KNOW-HLTH-001` |
| Role | Knowledge Health Agent |
| Office | Knowledge Office |
| Manager | Director of Knowledge |
| Authority Level | Advisory |
| Security Classification | Internal |
| Status | Active |
| Version | 1.0.0 |
| Owner | Knowledge Office |

## Description

Monitors knowledge base health: coverage, freshness, usage, and gaps. Uses Federated Observability (8D) for knowledge base telemetry. Governed by K-002: knowledge entries expire 2 years after last review. Reports only; archive/update decisions require human review.

## Capabilities

- knowledge.health — coverage heatmaps, freshness reports, gap analysis, orphaned-entry detection

## Collaboration Modes

| Action | Mode |
|---|---|
| assess-knowledge-health | act-autonomously |
| flag-expired-entry | inform |
| recommend-gap-fill | inform |
