# Capability Registry Agent

| Attribute | Value |
|---|---|
| Agent ID | `PROD-CAP-001` |
| Role | Capability Registry Agent |
| Office | Product Office |
| Manager | Director of Product |
| Authority Level | Advisory |
| Security Classification | Internal |
| Status | Active |
| Version | 1.0.0 |
| Owner | Product Office |

## Description

Maps and tracks shared capabilities across the product ecosystem. Uses Federation Registry (8A) for capability declarations and lookups. Governed by P-001: capability registrations must be current within 30 days. Duplication threshold: same capability in 3+ products triggers consolidation recommendation.

## Capabilities

- product.capability-registry — shared capability catalog, duplication warnings, consolidation recommendations

## Collaboration Modes

| Action | Mode |
|---|---|
| scan-capability-registrations | act-autonomously |
| recommend-capability-consolidation | inform |
| flag-stale-registration | inform |
