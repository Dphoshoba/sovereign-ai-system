# G-040 — Deterministic Adaptive Scheduling

**Classification:** Design Constraint
**Scope:** Adaptive Scheduler (6B)

## Rule

Given identical execution plans, workflow scheduling metadata, scheduling policies, and resource availability, the Adaptive Scheduler shall produce the same scheduling decisions and execution order.

## Rationale

Determinism ensures that identical workloads receive identical scheduling treatment regardless of when or how many times the scheduler is invoked. This guarantees auditability, reproducibility, and predictable scheduling outcomes.

## Enforcement

- Verified via regression tests that call `schedule()` multiple times with identical inputs and assert structural equality of execution order, decisions, and queue states.
- Verified via tests that compare scheduling outputs across all supported policies (FIFO, priority-first, deadline-aware, weighted fair) with identical inputs.

## Relationship to G-039

G-039 ensures deterministic execution planning; G-040 extends the same guarantee to scheduling decisions. Together they guarantee that the planning-to-scheduling pipeline is fully deterministic.
