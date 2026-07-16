# Drive Connector Architecture Migration Summary

## Context
The Google Drive connector is being migrated from a "SCAFFOLD_ONLY" state to a "CERTIFIED" state following the pattern established by the Gmail and Calendar connectors.

## Architectural Alignment
The Drive connector will strictly follow the **Connector Platform SDK** and the **Gamma-Sovereign-OS** governance model. 

### 1. Read Path (Stage 1)
- **Pattern**: `GammaReaderBase` $\rightarrow$ `ResourceParser` $\rightarrow$ `ApiClient`.
- **Consistency**: No deviation from the Calendar read-only foundation.

### 2. Mutation Path (Stage 2)
- **Pattern**: `MutationPreview` $\rightarrow$ `MutationGovernance` $\rightarrow$ `MutationApproval` $\rightarrow$ `MutationQueuePrep`.
- **Determinism**: All steps are deterministic. No live execution occurs in Stage 2.
- **Guardrails**: 
  - `previewOnly: true`
  - `executionAllowed: false`
  - `liveExecutionAuthorized: false`

### 3. Execution Path (Stage 3)
- **Pattern**: `ApprovedAction` $\rightarrow$ `ApiClient` $\rightarrow$ `ActionReceipt`.
- **Control**: Blocked pending explicit approval.

## Key Decisions
- **Single Architecture**: No second connector architecture is introduced.
- **Pattern Reuse**: The logic for idempotency and priority mapping from `lib/connectors/calendar/mutation-queue-prep.ts` is the source of truth for Drive's queue preparation.
- **Security**: All Drive mutations are categorized as "High Risk" if they involve public sharing or ownership changes, requiring human approval.
