# Connector Runtime Interface (CRI)

**Version:** 1.0.0
**Status:** CERTIFIED AND FROZEN
**Owner:** Platform Architecture Board
**Approval Authority:** Project Lead / Governance Board
**Effective Date:** 2026-07-17
**Change Control:** Requires Formal Architectural Review (ARB)
**Related Standards:** [SOP-CONNECTOR-CERTIFICATION]

## 1. Overview
The Connector Runtime Interface (CRI) defines the standard methods that any connector must implement to be compatible with the Gamma Execution Runtime. This ensures that the runtime can manage the lifecycle of a mutation without knowing the specific details of the provider's API.

## 2. The CRI Contract
Every connector must implement the following interface:

```typescript
interface ConnectorRuntime {
  /**
   * Final pre-execution check.
   * Fetches the current resource state and compares it to the 
   * proposedState in the preview.
   * Throws error if state has diverged significantly.
   */
  async prepare(candidate: QueueCandidate): Promise<void>;

  /**
   * Performs the actual mutation.
   * Must be idempotent based on the candidate's idempotencyToken.
   */
  async execute(candidate: QueueCandidate): Promise<ExecutionResult>;

  /**
   * Verifies the mutation was successful via a separate read-only call.
   * Returns the new state of the resource.
   */
  async verify(candidate: QueueCandidate, result: ExecutionResult): Promise<VerificationResult>;

  /**
   * Attempts to undo the mutation if it was partially completed
   * or if the verify() phase failed.
   */
  async rollback?(candidate: QueueCandidate, error: Error): Promise<void>;

  /**
   * Generates a detailed audit summary of the execution for the log.
   */
  async audit(candidate: QueueCandidate, result: ExecutionResult): Promise<AuditSummary>;
}
```

## 3. Implementation Guidelines
### 3.1 `prepare()`
Should be used to check for "mid-air collisions." For example, in Google Drive, it should verify that the folder hasn't been deleted since the preview was generated.

### 3.2 `execute()`
Must map the `ExecutionManifest` to the specific provider API. It must include the `idempotencyToken` in the API request if the provider supports it (e.g., using `S-S-S` headers or specific API parameters).

### 3.3 `verify()`
Must not rely on the response of the `execute()` call alone. It should perform a fresh `GET` request to verify the resource's state matches the intended outcome.

### 3.4 `rollback()`
Optional but highly recommended. For a "Move" operation, this might involve moving the resource back to its original parent.
