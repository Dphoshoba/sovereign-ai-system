# G-047 — Certified Federation Membership

**Classification:** Design Constraint
**Scope:** Federation Registry (8A)

## Rule

1. **Identity-Bound Membership** — Every node in the federation must be registered with a unique, immutable `NodeIdentity` containing nodeId, host, platformVersion, and metadata. No two nodes may share the same nodeId.
2. **Deterministic Registration** — Registration with identical identity, role, and capabilities must produce identical node state (excluding timestamps). The registry must reject duplicate registration.
3. **Trust is Directed** — Trust relationships are directional (`fromNode → toNode`). `verifyTrust(A, B)` must not imply `verifyTrust(B, A)` unless a separate trust relationship exists.
4. **Capability Resolution** — `resolveCapability(type, minVersion)` must return only active nodes whose advertised capability satisfies the minimum version constraint.
5. **Audit Trail** — Every mutation (registration, unregistration, heartbeat, trust establishment/revocation, capability advertisement) must produce an immutable `FederationEvent` with id, type, nodeId, detail, and timestamp.
6. **Passive Registry** — The Federation Registry is a passive membership store. It must not execute workflows, coordinate remote execution, synchronize policies, replicate state, or bypass local governance.

## Rationale

The Federation Registry is the foundation of multi-platform cooperation. Every subsequent Phase VIII stage depends on deterministic, auditable federation membership. Without the constraints in G-047, cross-platform coordination (8B), federated governance (8C), and federated observability (8D) would lack a trustworthy membership basis.

## Enforcement

- Verified via tests that duplicate registration throws `FederationRegistryError`.
- Verified via tests that `verifyTrust` is directional.
- Verified via tests that `resolveCapability` respects version constraints and active status.
- Verified via tests that every mutation type produces a corresponding `FederationEvent`.
- Verified via tests that `listNodes` and `getEvents` return immutable snapshots.

## Relationship to G-001 through G-046

G-047 is the first governance policy in Phase VIII. It establishes the membership layer that later stages (8B–8D) build upon, following the same compositional layering as Phases III–VII.
