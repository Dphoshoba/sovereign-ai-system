# G-039 — Deterministic Execution Planning

**Classification:** Design Constraint
**Scope:** Planning Engine (6A)

## Rule

Given identical workflow definitions, provider capability metadata, policy inputs, and planning context, the Planning Engine shall produce the same primary execution plan and the same ranked alternatives.

## Rationale

Determinism ensures auditability, reproducibility, and predictable planning outcomes. Non-deterministic planning would make it impossible to verify that the same workflow always receives the same execution strategy.

## Enforcement

- Verified via regression tests that call `plan()` multiple times with identical inputs and assert structural equality of selected plan and alternatives.
- Verified via tests that compare plan outputs across identically constructed workflow definitions.
