# Governance Decision GOV-2026-Stage3C-008

**Date:** 2026-07-18
**Resolution:** APPROVED
**Workstream:** Stage 3C.3 — Rollback Planning & Simulation
**Status:** CERTIFIED

## Decision

The Governance Board ratifies G-018 — Deterministic Rollback Planning as a governance policy.

## Rationale

Rollback plans must be deterministic — identical inputs must produce identical plan hashes, compensation chains, and audit logs. This ensures reproducibility across certification, simulation, and execution environments.

## Policy

**G-018 — Deterministic Rollback Planning:** Every rollback plan SHALL produce a deterministic planHash derived from its contents. The compensation chain SHALL be generated deterministically from the plan. The coordinator SHALL verify plan and chain validity before simulation or execution.
