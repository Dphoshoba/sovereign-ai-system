# Connector Certification Standard

**Standard Version:** 1.0.0
**Ownership:** Platform Governance Board
**Status:** ACTIVE / CANONICAL

## Change History
| Version | Date | Author | Change Description |
| :--- | :--- | :--- | :--- |
| 1.0.0 | 2026-07-17 | Hermes Agent | Initial standard established for connector lifecycle and security. |

## Architectural Review Requirement
Any deviation from this standard, or the introduction of new "Stages" in the certification lifecycle, requires a formal Architectural Review and sign-off from the Platform Governance Board. All connectors must be reviewed against this standard during every stage transition.

## 1. Certification Lifecycle

Connectors are certified in incremental stages to minimize risk and ensure a strictly governed rollout.

### Stage 1: Governed Read-Only Foundation
**Goal:** Establish secure connectivity and a read-only metadata interface.
- **Permitted:** Metadata retrieval, resource discovery, permission analysis.
- **Prohibited:** Content retrieval (binaries, streams), any mutation, exports, downloads.
- **Exit Criteria:** 
  - Fully functional read-only metadata API.
  - Integration with `ResourceSecurityClassifier`.
  - 100% test pass rate for metadata operations.

### Stage 2: Governed Mutation Previews (2A $\rightarrow$ 2B $\rightarrow$ 2C)
**Goal:** Implement deterministic change proposal and governance.
- **Stage 2A (Previews):** Ability to generate deterministic "Dry Run" diffs of intended changes.
- **Stage 2B (Governance):** Integration with platform review boards and approval workflows.
- **Stage 2C (Queue Prep):** Implementation of operation queuing and idempotency tokens.
- **Prohibited:** Actual execution of mutations on the remote provider.
- **Exit Criteria:** Deterministic previews generated and verified; governance hooks integrated.

### Stage 3: Controlled Execution
**Goal:** Enable live mutations under strict operational guardrails.
- **Permitted:** Authorized mutations (updates, deletes, moves).
- **Requirement:** Must be preceded by Stage 2 certification. Requires explicit "Production Readiness" sign-off.
- **Exit Criteria:** Successful execution of mutation pipeline with full audit logging.

---

## 2. Mandatory Certification Gates

Before a connector can be tagged as certified for any stage, it must pass the following automated gates:

| Gate | Command | Requirement |
| :--- | :--- | :--- |
| **Type Check** | `npx tsc --noEmit --pretty false` | 0 errors. No index-signature/SDR warnings. |
| **Unit Tests** | `npm test -- tests/connectors/<name>` | 100% pass rate. No flaky tests. |
| **Full Suite** | `npm test` | No regressions in other connectors or platform core. |
| **Build** | `npm run build` | Successful production build without errors. |
| **Determinism** | `npm run test:determinism` | No critical non-deterministic calls (`Date.now`, `Math.random`) in core logic. |

---

## 3. Mandatory Security Reviews

Every stage transition requires a documented review of the following vectors:

1. **Boundary Review:** Verify that no prohibited API calls (e.g., `.download()`) exist in the current stage.
2. **Permission Escalation:** Ensure the connector cannot perform actions beyond the provided OAuth scopes.
3. **Metadata Leakage:** Verify that internal platform IDs are not leaked to the provider and vice versa.
4. **Secret Review:** Ensure no API keys or tokens are logged or stored in plain text.
5. **Public Interface Review:** Validate that the connector's public API complies with the Connector SDK.
6. **Capability Registry Review:** Ensure the `capabilities` manifest accurately reflects the implementation.

---

## 4. Freeze & Tagging Procedure

Once all gates and reviews are passed, the implementation is frozen:

1. **Documentation:** Create/Update `<CONNECTOR>_STAGE<X>_CERTIFICATION_REPORT.md` and `GAMMA_PROGRESS.md`.
2. **Cleanse:** Remove all `TODO`s, debug logs, and temporary logic.
3. **Commit:** `git commit -m "cert(<connector>): certify Stage <X> <description>"`
4. **Tag:** `git tag -a gamma-<connector>-stage<x>-<status>`
5. **Push:** Push commit and tag to the origin.

---

## 5. Completion Criteria

A connector is considered "Certified" for a stage when:
- [ ] All mandatory gates are PASS.
- [ ] All mandatory reviews are documented as COMPLETE.
- [ ] The certification report explicitly states the boundary constraints.
- [ ] The release tag is successfully applied and verified.
