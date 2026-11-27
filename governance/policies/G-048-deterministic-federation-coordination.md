# G-048 — Deterministic Federation Coordination

**Classification:** Design Constraint
**Scope:** Cross-Platform Coordination (8B)

## Rule

1. **Trust-Gated Execution** — No remote execution request shall be accepted unless the source node has an active trust relationship with the target node via the Federation Registry (G-047).
2. **Tracked Execution** — Every remote execution request must produce a `CrossNodeExecution` record with unique id, correlation id, source/target nodes, workflow type, status, and timestamps.
3. **Deterministic Rejection** — An untrusted request must produce the same rejection result (`status: 'rejected'`) regardless of timing or system state.
4. **Correlation** — All executions spawned from the same root request must share a `correlationId` for cross-node traceability.
5. **Passive Coordination** — The coordinator must not bypass local governance, replicate execution runtimes, or assume control of target node operations.

## Rationale

Cross-platform coordination must be gated on trust (8A) and tracked deterministically. Without these constraints, federated execution would be indistinguishable from unauthorized access, and cross-node debugging would be impossible. The coordinator routes requests between nodes — it does not execute them.

## Enforcement

- Verified via tests that untrusted requests are rejected with `CrossPlatformCoordinatorError`.
- Verified via tests that trusted requests produce tracked executions with unique IDs.
- Verified via tests that correlation IDs are unique per request and retrievable via `getCorrelatedExecutions`.
- Verified via tests that execution status transitions (accepted → completed, rejected) are deterministic.
- Verified via tests that unknown source/target nodes throw errors.

## Relationship to G-047

G-047 establishes the Federation Registry and trust model that 8B depends on for gatekeeping. G-048 extends the deterministic, auditable principles of G-047 into the coordination layer.
