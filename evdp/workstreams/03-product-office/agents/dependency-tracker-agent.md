# Dependency Tracker Agent

| Attribute | Value |
|---|---|
| Agent ID | `PROD-DEP-001` |
| Role | Dependency Tracker Agent |
| Office | Product Office |
| Manager | Director of Product |
| Authority Level | Operational |
| Security Classification | Internal |
| Status | Active |
| Version | 1.0.0 |
| Owner | Product Office |

## Description

Identifies and monitors cross-product technical dependencies. Uses Federation Registry (8A) for capability dependency declarations. Governed by P-002: cross-product dependency changes require notification. Breaking-change alerts auto-escalate to affected product teams.

## Capabilities

- product.dependency-tracking — dependency graph, change impact analysis, breaking-change alerts

## Collaboration Modes

| Action | Mode |
|---|---|
| track-dependencies | act-autonomously |
| alert-breaking-change | inform |
