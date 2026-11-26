# Execution Audit Specification

**Version:** 1.0.0
**Status:** CERTIFIED AND FROZEN
**Owner:** Platform Architecture Board
**Approval Authority:** Project Lead / Governance Board
**Effective Date:** 2026-07-17
**Change Control:** Requires Formal Architectural Review (ARB)
**Related Standards:** [SOP-CONNECTOR-CERTIFICATION]

## 1. The Immutable Audit Log
Every mutation must produce a permanent, non-modifiable audit record. This log is the canonical source of truth for "who did what, when, and why."

## 2. Audit Record Schema
Every record must contain:

| Field | Description | Source |
| :--- | :--- | :--- |
| `executionId` | Unique ID for this specific run attempt | Runtime |
| `queueId` | The ID of the `QueueCandidate` | Queue |
| `decisionId` | The ID of the `GovernanceDecision` | Governance |
| `previewId` | The ID of the original `MutationPreview` | Preview |
| `connectorId` | The connector used (e.g., `google-drive`) | Connector |
| `operation` | The action performed (e.g., `files.update`) | Connector |
| `resourceId` | The unique ID of the affected resource | Connector |
| `outcome` | `SUCCESS` \| `FAILED` \| `CANCELLED` \| `ROLLBACK_SUCCESS` | Runtime |
| `errorClass` | `TRANSIENT` \| `PERMANENT` \| `GOVERNANCE_VIOLATION` \| `SAFETY_FAIL` | Runtime |
| `timestamp` | ISO timestamp of the final outcome | Runtime |
| `operator` | The user/system that authorized the execution | Governance |
| `evidence` | Link to the `ReviewPackage` and execution logs | Platform |

## 3. Audit Lifecycle
1. **Intent:** Log the transition from `QUEUED` $\rightarrow$ `PROCESSING`.
2. **Action:** Log the precise API call made to the provider.
3. **Outcome:** Log the provider's response and the result of the `verify()` phase.
4. **Finality:** Seal the record and link it to the resource's version history.

## 4. Error Classification
To facilitate analytics and recovery, errors are classified as:
- **SENSITIVE_FAILURE:** Security or governance violations.
- **INFRA_FAILURE:** Timeouts, network issues, 5xx.
- **DATA_FAILURE:** 400 Bad Request, conflict, missing resource.
- **AUTH_FAILURE:** Token expired, scope missing.
