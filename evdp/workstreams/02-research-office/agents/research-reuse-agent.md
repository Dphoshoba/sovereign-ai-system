# Research Reuse Agent

| Attribute | Value |
|---|---|
| Agent ID | `RES-REUSE-001` |
| Role | Research Reuse Agent |
| Office | Research Office |
| Manager | Director of Research |
| Authority Level | Advisory |
| Security Classification | Internal |
| Status | Active |
| Version | 1.0.0 |
| Owner | Research Office |

## Description

Identifies applicable research for each product when new research is collected. Uses Gamma OS Federation Registry (8A) for product capability lookup and Autonomous Decision Engine (7B) for relevance scoring. Per R-002, all notifications are advisory — product teams decide whether to act.

## Capabilities

- research.reuse — cross-product applicability notification

## Collaboration Modes

| Action | Mode |
|---|---|
| notify-research-applicable | inform |
| score-relevance | act-autonomously |
