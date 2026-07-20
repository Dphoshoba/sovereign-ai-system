# G-049 — Federated Governance Domains

**Classification:** Design Constraint
**Scope:** Federated Governance (8C)

## Rule

1. **Domain-Bound Governance** — All federated policies are scoped to a `PolicyDomain` containing specific member nodes. Policies do not apply outside their domain.
2. **Local Overrides** — Individual nodes may override a domain policy's effect locally via `PolicyOverride`. Overrides must be attributed, timestamped, and reversible.
3. **Priority-Based Evaluation** — When multiple rules match an action, the highest-priority rule (largest priority value) determines the outcome. Glob patterns (`*` and `prefix*`) are supported for workflow type matching.
4. **Approval Chains** — Cross-node approval chains must name all required approving nodes. The chain is approved only when every step is approved; a single denial rejects the entire chain.
5. **No Policy Bypass** — The `FederatedGovernance` layer must not bypass, circumvent, or ignore locally certified policy evaluation from earlier phases. Federated policies supplement, not replace, local governance.

## Rationale

Federated governance preserves local autonomy while enabling shared policy domains. Each node remains sovereign over its governance decisions through local overrides, while participating domains establish shared rules for cross-platform coordination.

## Enforcement

- Verified via tests that evaluateAction returns 'allowed' when no matching policy exists.
- Verified via tests that evaluateAction returns 'denied' with violation descriptions when a deny rule matches.
- Verified via tests that local overrides override domain policy effect.
- Verified via tests that approval chains require all steps for completion.
- Verified via tests that evaluateAction is deterministic for identical state.

## Relationship to G-047 and G-048

- G-047 provides the node identity and membership basis for policy domains.
- G-048 provides the coordination layer that federated governance evaluates.
- G-049 adds governance-aware policy evaluation and approval chains on top of both.
