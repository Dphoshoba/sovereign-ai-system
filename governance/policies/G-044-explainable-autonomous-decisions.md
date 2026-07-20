# G-044 — Explainable Autonomous Decisions

**Classification:** Design Constraint
**Scope:** Autonomous Decision Engine (7B)

## Rule

Given identical operational state, policy definitions, analytics, and execution context, the Autonomous Decision Engine shall produce the same recommended action, confidence score, rationale, and audit record.

## Rationale

Autonomous decisions affect platform operations. Without explainability and determinism, autonomous behaviour becomes opaque, untrustworthy, and impossible to audit. Every decision must be traceable to its inputs and reproducible from the same conditions.

## Enforcement

- Verified via regression tests that call `evaluate()` with identical `TriggeringState` across separate engine instances and assert structural equality of selected action, confidence, risk assessment, and audit record.
- Verified via tests that confirm all candidates include rationale and rejected alternatives include rejection reasons.

## Relationship to G-043

G-043 ensures operational state is deterministic and auditable. G-044 extends the same guarantees to decisions derived from that state, ensuring the full state-to-decision pipeline is reproducible.
