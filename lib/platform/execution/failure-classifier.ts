export enum ExecutionFailureCode {
  INVALID_EXECUTION_PACKAGE = 'INVALID_EXECUTION_PACKAGE',
  GOVERNANCE_REVALIDATION_FAILED = 'GOVERNANCE_REVALIDATION_FAILED',
  APPROVAL_MISSING = 'APPROVAL_MISSING',
  POLICY_VERSION_MISMATCH = 'POLICY_VERSION_MISMATCH',
  GOVERNANCE_VERSION_MISMATCH = 'GOVERNANCE_VERSION_MISMATCH',
  PREVIEW_STALE = 'PREVIEW_STALE',
  METADATA_STALE = 'METADATA_STALE',
  SCOPE_MISSING = 'SCOPE_MISSING',
  CONNECTOR_NOT_REGISTERED = 'CONNECTOR_NOT_REGISTERED',
  CAPABILITY_NOT_SUPPORTED = 'CAPABILITY_NOT_SUPPORTED',
  REPLAY_DETECTED = 'REPLAY_DETECTED',
  IDEMPOTENCY_CONFLICT = 'IDEMPOTENCY_CONFLICT',
  LOCK_CONFLICT = 'LOCK_CONFLICT',
  FEATURE_DISABLED = 'FEATURE_DISABLED',
  KILL_SWITCH_ACTIVE = 'KILL_SWITCH_ACTIVE',
  ENVIRONMENT_PROHIBITED = 'ENVIRONMENT_PROHIBITED',
  EXECUTION_NOT_AUTHORIZED = 'EXECUTION_NOT_AUTHORIZED',
  S3A_EXECUTION_BLOCKED = 'S3A_EXECUTION_BLOCKED',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  AUDIT_GENERATION_FAILED = 'AUDIT_GENERATION_FAILED',
  SAFETY_GAUNTLET_FAILED = 'SAFETY_GAUNTLET_FAILED',
  QUEUE_INVALID = 'QUEUE_INVALID',
}

export interface FailureMetadata {
  description: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  isTransient: boolean;
  remediation: string;
}

export const FAILURE_TAXONOMY: Record<ExecutionFailureCode, FailureMetadata> = {
  [ExecutionFailureCode.INVALID_EXECUTION_PACKAGE]: {
    description: 'The provided execution package is missing required fields or is malformed.',
    severity: 'HIGH',
    isTransient: false,
    remediation: 'Re-generate the QueueCandidate using the latest platform tools.',
  },
  [ExecutionFailureCode.GOVERNANCE_REVALIDATION_FAILED]: {
    description: 'The original governance decision is no longer valid under current policies.',
    severity: 'CRITICAL',
    isTransient: false,
    remediation: 'Resubmit the mutation request for governance review.',
  },
  [ExecutionFailureCode.APPROVAL_MISSING]: {
    description: 'Required human approval for this risk level was not found or has expired.',
    severity: 'HIGH',
    isTransient: false,
    remediation: 'Request a new approval from the authorized board.',
  },
  [ExecutionFailureCode.POLICY_VERSION_MISMATCH]: {
    description: 'The policy version used during preview is incompatible with the current runtime.',
    severity: 'MODERATE',
    isTransient: false,
    remediation: 'Update the preview to use the current policy version.',
  },
  [ExecutionFailureCode.GOVERNANCE_VERSION_MISMATCH]: {
    description: 'The governance version is outdated and cannot be processed by this runtime.',
    severity: 'MODERATE',
    isTransient: false,
    remediation: 'Regenerate the governance request.',
  },
  [ExecutionFailureCode.PREVIEW_STALE]: {
    description: 'The resource has changed since the mutation preview was generated.',
    severity: 'HIGH',
    isTransient: false,
    remediation: 'Generate a new mutation preview based on current metadata.',
  },
  [ExecutionFailureCode.METADATA_STALE]: {
    description: 'The metadata used for pre-flight validation is outdated.',
    severity: 'MODERATE',
    isTransient: true,
    remediation: 'Automatic retry will refresh metadata.',
  },
  [ExecutionFailureCode.SCOPE_MISSING]: {
    description: 'The active OAuth session lacks the required scopes for this operation.',
    severity: 'HIGH',
    isTransient: true,
    remediation: 'Re-authenticate the connector with the required scopes.',
  },
  [ExecutionFailureCode.CONNECTOR_NOT_REGISTERED]: {
    description: 'The connector specified in the package is not registered in the runtime.',
    severity: 'CRITICAL',
    isTransient: false,
    remediation: 'Ensure the connector is correctly installed and registered.',
  },
  [ExecutionFailureCode.CAPABILITY_NOT_SUPPORTED]: {
    description: 'The connector does not support the requested mutation operation.',
    severity: 'HIGH',
    isTransient: false,
    remediation: 'Verify operation support in the connector documentation.',
  },
  [ExecutionFailureCode.REPLAY_DETECTED]: {
    description: 'A duplicate submission of this operation was detected.',
    severity: 'MODERATE',
    isTransient: false,
    remediation: 'Check the status of the original operation using the idempotency token.',
  },
  [ExecutionFailureCode.IDEMPOTENCY_CONFLICT]: {
    description: 'The idempotency token provided conflicts with an existing operation.',
    severity: 'HIGH',
    isTransient: false,
    remediation: 'Verify if the operation was already executed or is currently processing.',
  },
  [ExecutionFailureCode.LOCK_CONFLICT]: {
    description: 'Unable to acquire an execution lock for the target resource.',
    severity: 'MODERATE',
    isTransient: true,
    remediation: 'Retry operation after a short delay.',
  },
  [ExecutionFailureCode.FEATURE_DISABLED]: {
    description: 'The specific mutation feature is currently disabled in the platform config.',
    severity: 'MODERATE',
    isTransient: false,
    remediation: 'Contact the platform administrator to enable the feature.',
  },
  [ExecutionFailureCode.KILL_SWITCH_ACTIVE]: {
    description: 'The global execution kill-switch is currently active.',
    severity: 'CRITICAL',
    isTransient: false,
    remediation: 'Wait for the kill-switch to be deactivated by the security team.',
  },
  [ExecutionFailureCode.ENVIRONMENT_PROHIBITED]: {
    description: 'Execution is prohibited in the current environment (e.g. development).',
    severity: 'HIGH',
    isTransient: false,
    remediation: 'Promote the operation to a sanctioned execution environment.',
  },
  [ExecutionFailureCode.EXECUTION_NOT_AUTHORIZED]: {
    description: 'The current runtime configuration prohibits live execution.',
    severity: 'CRITICAL',
    isTransient: false,
    remediation: 'Update runtime capabilities to allow execution (S3C transition).',
  },
  [ExecutionFailureCode.S3A_EXECUTION_BLOCKED]: {
    description: 'Operation blocked by the Stage 3A non-executing boundary.',
    severity: 'MODERATE',
    isTransient: false,
    remediation: 'This is expected behavior in Stage 3A. Proceed to Stage 3B/3C for execution.',
  },
  [ExecutionFailureCode.INVALID_STATE_TRANSITION]: {
    description: 'The runtime attempted an illegal state transition.',
    severity: 'CRITICAL',
    isTransient: false,
    remediation: 'Report as a critical bug in the runtime state machine.',
  },
  [ExecutionFailureCode.AUDIT_GENERATION_FAILED]: {
    description: 'The runtime failed to generate a deterministic audit record.',
    severity: 'HIGH',
    isTransient: false,
    remediation: 'Check serialization integrity of the runtime context.',
  },
  [ExecutionFailureCode.SAFETY_GAUNTLET_FAILED]: {
    description: 'The safety gauntlet detected a critical risk that blocks execution.',
    severity: 'CRITICAL',
    isTransient: false,
    remediation: 'Review the safety gauntlet failure reasons and adjust the mutation.',
  },
  [ExecutionFailureCode.QUEUE_INVALID]: {
    description: 'The queue candidate failed basic structural validation.',
    severity: 'HIGH',
    isTransient: false,
    remediation: 'Regenerate the queue candidate using the current platform specification.',
  },
}
