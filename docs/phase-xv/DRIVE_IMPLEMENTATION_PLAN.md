# Google Drive Implementation Plan: Governed Integration

## Existing Drive Inventory
The current state of the Google Drive connector is a **SCAFFOLD_ONLY** implementation. It provides the necessary structural boilerplate to align with the Connector Platform SDK but lacks functional logic.

### Capability Audit
| Capability | Status | Source | Notes |
| :--- | :--- | :--- | :--- |
| **Read-Only** | | | |
| OAuth | SCAFFOLD_ONLY | `oauth-adapter.ts` | Endpoints defined; `exchangeCode`/`refreshToken` not implemented. |
| List Drives / Folders | NOT_STARTED | - | No logic in `api-client.ts` or `action-set.ts`. |
| File Metadata | SCAFFOLD_ONLY | `resource-parser.ts` | Basic parser exists; no real API fetching. |
| File Search | NOT_STARTED | - | - |
| Download Auth | NOT_STARTED | - | - |
| Version Awareness | NOT_STARTED | - | - |
| Duplicate Detection | NOT_STARTED | - | - |
| Ownership/Permissions | SCAFFOLD_ONLY | `resource-parser.ts` | Basic `owners` field parsed. |
| MIME Classification | SCAFFOLD_ONLY | `resource-parser.ts` | Basic `mimeType` field parsed. |
| Quota & Health | SCAFFOLD_ONLY | `production-readiness.ts` | Logic for projection exists; real data missing. |
| Scope Validation | SCAFFOLD_ONLY | `oauth-adapter.ts` | Scopes listed; validation not integrated. |
| **Mutation Preparation** | | | |
| Upload Preview | NOT_STARTED | - | - |
| Folder Creation Preview | NOT_STARTED | - | - |
| Move/Rename Preview | NOT_STARTED | - | - |
| Permission/Sharing Preview | NOT_STARTED | - | - |
| Delete/Trash Preview | NOT_STARTED | - | - |
| Restore Preview | NOT_STARTED | - | - |
| **Governed Lifecycle** | | | |
| Validation | NOT_STARTED | - | - |
| Human Approval | NOT_STARTED | - | - |
| Queue Preparation | NOT_STARTED | - | - |
| Execution Intent | NOT_STARTED | - | - |
| Receipts / Audit | NOT_STARTED | - | - |
| Retry / Idempotency | NOT_STARTED | - | - |
| Controlled Execution | SCAFFOLD_ONLY | `action-set.ts` | Dummy `execute` method returns "queued". |
| **Security** | | | |
| Public Sharing Risk | NOT_STARTED | - | - |
| Credential Exposure | VERIFIED | `oauth-adapter.ts` | Token masking implemented. |
| Log Leakage | NOT_STARTED | - | - |
| Permission Deltas | NOT_STARTED | - | - |
| Sensitive Classification | NOT_STARTED | - | - |

## Reuse Matrix
To maintain architectural consistency, the following patterns from Gmail and Calendar will be ported to Drive:

| Drive Component | Reference Implementation | Pattern to Reuse |
| :--- | :--- | :--- |
| **Read Foundation** | `lib/connectors/calendar/` | Use of `GammaReaderBase` and deterministic resource parsing. |
| **Preview Layer** | `lib/connectors/calendar/mutation-preview.ts` | Deterministic "before/after" state and `previewOnly: true` flag. |
| **Governance** | `lib/connectors/calendar/mutation-governance.ts` | Risk-level based decision engine and `GovernancePolicyEngine` integration. |
| **Approval** | `lib/connectors/calendar/mutation-approval.ts` | Preparation of human-review evidence. |
| **Queue Prep** | `lib/connectors/calendar/mutation-queue-prep.ts` | Deterministic `queueEntryId` and `idempotencyKey` generation. |
| **Certification** | `docs/phase-xv/` | The 3-stage certification process (Read $\rightarrow$ Prep $\rightarrow$ Execute). |

## Implementation Stages

## Implementation Stages

### Stage 1: Governed Read-Only Foundation
**Goal**: Establish a fully certified read-only connector that can discover, classify, and inspect Drive resources without mutation or content retrieval.
1. **OAuth Hardening**: Implement `exchangeCode` and `refreshToken` via the SDK.
2. **Drive Discovery**: Implement `list` and `search` operations in `api-client.ts`.
3. **Resource Parsing & Classification**: Expand `resource-parser.ts` to include full Google Drive metadata and implement the **Drive Security Classification Matrix**.
4. **Read-Only Actions**: Implement `drive_read` in `action-set.ts` with full deterministic flow.
5. **Certification**: Pass Stage 1 Gates (including the **Permission Escalation Review**) $\rightarrow$ Tag `gamma-drive-stage1-read-only`.

### Stage 2A: Deterministic Mutation Previews
**Goal**: Enable "What if?" analysis for all Drive mutations.
1. **Preview Logic**: Create `mutation-preview.ts` providing deterministic state deltas for:
   - `upload`, `createFolder`, `rename`, `move`, `trash`, `restore`, `updatePermissions`, `share`.
2. **Risk Analysis**: Integrate "Public Sharing" and "Sensitive File" risk detection.
3. **Validation**: Ensure `executionAllowed: false` and `previewOnly: true`.

### Stage 2B: Governance and Approval Preparation
**Goal**: Bind previews to organizational policy.
1. **Governance Engine**: Implement `mutation-governance.ts` using the `GovernancePolicyEngine`.
2. **Approval Flow**: Implement `mutation-approval.ts` to prepare the evidence needed for human review.
3. **Receipts**: Generate deterministic preview receipts and audit records.

### Stage 2C: Queue Preparation
**Goal**: Create a deterministic, immutable request for the execution engine.
1. **Queue Prep**: Implement `mutation-queue-prep.ts`.
2. **Idempotency**: Generate deterministic `queueEntryId` and `idempotencyKey`.
3. **Priority Mapping**: Map risk level $\rightarrow$ queue priority.
4. **Certification**: Pass Stage 2 Gates $\rightarrow$ Tag `gamma-drive-stage2-governed-mutations`.

### Stage 3: Controlled Execution (BLOCKED)
**Goal**: Perform real mutations.
1. **Execution Logic**: Implement real API calls to Google Drive.
2. **Atomic Commits**: Ensure mutations are atomic and logged.
3. **Final Certification**: Complete full system audit.

## Security Model
- **No-Write Guard**: Every module in Stage 1 and 2 MUST be scanned to ensure no `create`, `update`, `delete` or `patch` calls are made to the API.
- **Credential Isolation**: Use only the `OAuthAdapter` for token management. No secrets in code.
- **Permission Transparency**: All permission changes must show a clear `before` $\rightarrow$ `after` delta in previews.
- **Privacy**: Ensure `DriveParser.sanitize` is used before any resource metadata enters a log or UI.

## Testing Strategy
- **Focused Tests**: Every new function must have a corresponding `.test.ts` file.
- **Determinism Tests**: Use `scripts/check-determinism.ts` to ensure no `Date.now()` or `Math.random()` leakage.
- **Negative Tests**: Intentionally provide invalid inputs to verify rejection logic.
- **Full Suite**: Run `npm test` to ensure zero regressions in other connectors.

## Definition of Done
- All implementation stages completed.
- All certification gates passed (TSC, Tests, Build, Determinism).
- Documentation updated and reports generated.
- Branch pushed and tags applied.
- Zero "True Violations" in security scans.
