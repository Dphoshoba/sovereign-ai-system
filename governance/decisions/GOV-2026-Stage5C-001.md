# Governance Decision GOV-2026-Stage5C-001

**Date:** 2026-07-19
**Resolution:** STAGE 5C AUTHORIZED
**Phase:** Stage 5C — Workflow Recovery
**Status:** IN PROGRESS

## Authorization

Stage 5C — Workflow Recovery is authorized.

## Scope

- Resume execution from checkpoint
- Pause and checkpointing
- Compensation across workflow branches (consumes Phase IV rollback)
- Replay

## Constraint

Recovery must consume certified Phase IV primitives (TransactionCoordinator, SagaCompensator, CrossProviderRollback) for compensation. It must not reimplement them.

## Governance

G-037 — Certified Workflow Recovery (proposed).
