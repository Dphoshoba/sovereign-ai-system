import { QueueCandidate } from "../queue/types";
import { GovernanceDecision } from "../governance/types";
import { ConnectorRuntimeCapabilities } from "./capabilities";
import { ExecutionFailureCode } from "./failure-classifier";

export class SafetyGauntlet {
  /**
   * Performs a strict check of the execution package and runtime capabilities.
   * Returns failure code if execution is prohibited.
   */
  static check(
    candidate: QueueCandidate,
    decision: GovernanceDecision,
    capabilities: ConnectorRuntimeCapabilities,
  ): ExecutionFailureCode | null {
    // 1. Basic Integrity
    if (!candidate.queueId || !candidate.decisionId) {
      return ExecutionFailureCode.INVALID_EXECUTION_PACKAGE;
    }

    // 2. Governance Version Compatibility
    if (
      candidate.governanceVersion !== '1.0.0' ||
      candidate.governanceVersion !== decision.governanceVersion
    ) {
      return ExecutionFailureCode.GOVERNANCE_VERSION_MISMATCH;
    }

    if (
      candidate.policyVersion !== '1.0.0' ||
      candidate.policyVersion !== decision.policyVersion
    ) {
      return ExecutionFailureCode.POLICY_VERSION_MISMATCH;
    }

    if (
      candidate.decisionId !== decision.decisionId ||
      !decision.queueEligible ||
      decision.blockingReasons.length > 0
    ) {
      return ExecutionFailureCode.GOVERNANCE_REVALIDATION_FAILED;
    }

    if (candidate.executionManifest.requiredScopes.length === 0) {
      return ExecutionFailureCode.SCOPE_MISSING;
    }

    // Stage 3A is non-executing regardless of caller-supplied capability flags.
    if (capabilities.stage === '3A') {
      return ExecutionFailureCode.S3A_EXECUTION_BLOCKED;
    }

    // 3. Capability Check
    if (!capabilities.execute) {
      return ExecutionFailureCode.EXECUTION_NOT_AUTHORIZED;
    }
    if (!capabilities.providerMutationAllowed || !capabilities.networkMutationAllowed) {
      return ExecutionFailureCode.CAPABILITY_NOT_SUPPORTED;
    }

    return null;
  }
}
