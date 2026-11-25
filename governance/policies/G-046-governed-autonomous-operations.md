# G-046 — Governed Autonomous Operations

**Classification:** Design Constraint
**Scope:** Operational Governance & Human Oversight (7D)

## Rule

1. **Threshold-Based Approval** — The GovernanceGate shall evaluate every `OperationalDecision` against a configurable `autoApproveThreshold`. Decisions whose `requiredApprovalLevel` exceeds the threshold must receive explicit human approval before execution.
2. **Action-Based Approval** — The GovernanceGate shall enforce approval for any action listed in `requireApprovalForActions`, regardless of level.
3. **Operator Override** — The OverrideManager shall allow operators to `allow`, `block`, or `force_state` on any action, provider, or globally. Overrides must be identified, timestamped, attributable, and optionally time-bound.
4. **Auditability** — All approval requests, verdicts, resolutions, and overrides shall be recorded and retrievable via `getPending()` and `getHistory()`.

## Rationale

Phase VII operates autonomously by default, but governance boundaries must be enforceable. The GovernanceGate ensures that high-risk decisions cannot proceed without oversight, while the OverrideManager provides a safety valve for operators to intervene when circumstances require.

## Enforcement

- Verified via tests that the gate auto-approves decisions at or below threshold and requires approval for those above.
- Verified via tests that the gate enforces action-specific approval requirements.
- Verified via tests that the OverrideManager resolves overrides correctly, including expiry and fallback.
- Verified via tests that all approval requests and resolutions are recorded and retrievable.

## Relationship to G-043 through G-045

- G-043 certifies operational state (7A) — the context for governance decisions.
- G-044 certifies autonomous decisions (7B) — the inputs to the GovernanceGate.
- G-045 certifies autonomous recovery (7C) — the actions the gate governs.
- G-046 certifies that the full autonomous pipeline (7A→7B→7C) operates within enforceable governance boundaries.
