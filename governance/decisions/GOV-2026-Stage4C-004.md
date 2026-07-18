# Governance Decision GOV-2026-Stage4C-004

**Date:** 2026-07-19
**Resolution:** APPROVED
**Milestone:** Stage 4C.4 — Manual Override
**Status:** CERTIFIED

## Summary

Manual Override allows operators to force any circuit state (CLOSED, OPEN, HALF_OPEN) with audit metadata, and to release overrides to restore normal operation.

## Deliverables

- Integrated into circuit-breaker-impl.ts: `forceState()`, `releaseOverride()`, manual override check in `check()`
- tests/platform/circuit-breaker.test.ts: override tests

## Governance

G-034 — Certified Provider Circuit Breaker ratified.
