# G-043 — Certified Operational State

**Classification:** Observability Constraint
**Scope:** Operational State Engine (7A)

## Rule

The Operational State Engine shall maintain a deterministic, explainable, and auditable representation of platform state derived from certified subsystem health and operational events. It shall not directly alter platform behaviour.

## Rationale

A certified operational state provides the authoritative foundation for downstream autonomous decision-making (Stage 7B). Without deterministic and auditable state, operational decisions cannot be verified, reproduced, or trusted.

## Enforcement

- Verified via regression tests that confirm identical health reports produce identical state and transitions across engine instances.
- Verified via architecture boundary tests that confirm no execution-control methods exist (no recover, reroute, reprioritize, modifyPlan, or approve methods).

## Relationship to G-041 (Observable Platform Behaviour)

G-041 ensures telemetry is non-invasive and reproducible. G-043 extends this principle to operational state: the state model is derived from telemetry and must be deterministic, but must not alter the behaviour it observes.
