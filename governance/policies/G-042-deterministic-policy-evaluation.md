# G-042 — Deterministic Policy Evaluation

**Classification:** Design Constraint
**Scope:** Policy Engine (6D)

## Rule

Given identical policy definitions, workflow metadata, execution context, and governance inputs, the Policy Evaluation Engine shall produce the same decision, rationale, and compliance record.

## Rationale

Deterministic policy evaluation ensures that governance decisions are reproducible, auditable, and consistent across evaluations. Non-deterministic policy evaluation would undermine the trustworthiness of the governance framework and make compliance verification impossible.

## Enforcement

- Verified via regression tests that call `evaluate()` multiple times with identical context and assert structural equality of outcomes.
- Verified via tests that compare outcomes across separate engine instances with identical policies and inputs.

## Relationship to G-039, G-040, G-041

G-039 ensures deterministic planning, G-040 ensures deterministic scheduling, G-041 ensures deterministic observability, and G-042 extends determinism to policy evaluation. Together they guarantee that the full platform produces consistent, auditable, and reproducible outcomes across all operational dimensions.
