# Governance Decision GOV-2026-Stage4C-003

**Date:** 2026-07-19
**Resolution:** APPROVED
**Milestone:** Stage 4C.3 — Automatic Recovery
**Status:** CERTIFIED

## Summary

Automatic Recovery provides OPEN → HALF_OPEN transition after configurable cooldown and HALF_OPEN → CLOSED on successful probe, enabling circuit breakers to self-heal.

## Deliverables

- Integrated into circuit-breaker-impl.ts: `cooldownMs` check in `check()`, `recordSuccess` auto-recovery from HALF_OPEN
- tests/platform/circuit-breaker.test.ts: recovery tests

## Governance

G-034 — Certified Provider Circuit Breaker ratified.
