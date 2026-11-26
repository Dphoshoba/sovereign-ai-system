import { QueueCandidate } from "./types";
import { GovernanceDecision } from "../governance/types";
import { MutationPreview } from "../../connectors/drive/mutation-preview";
import { QueueTokenService } from "./token-service";
import { ManifestGenerator } from "./manifest-generator";

export class QueueValidator {
  /**
   * Validates a QueueCandidate for integrity and security.
   */
  static validate(candidate: QueueCandidate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!candidate.queueId) errors.push('MISSING_QUEUE_ID');
    if (!candidate.connectorId) errors.push('MISSING_CONNECTOR_ID');
    if (!candidate.operation) errors.push('MISSING_OPERATION');
    if (!candidate.decisionId) errors.push('MISSING_DECISION_ID');
    if (!candidate.previewId) errors.push('MISSING_PREVIEW_ID');
    if (!candidate.reviewPackageId) errors.push('MISSING_REVIEW_PACKAGE_ID');
    if (!candidate.idempotencyToken) errors.push('MISSING_IDEMPOTENCY_TOKEN');
    if (!candidate.executionManifest) errors.push('MISSING_EXECUTION_MANIFEST');
    if (!candidate.replayProtection?.duplicateDetectionKey) {
      errors.push('MISSING_REPLAY_DETECTION_KEY');
    }
    if (!candidate.replayProtection?.conflictIdentity) {
      errors.push('MISSING_REPLAY_CONFLICT_IDENTITY');
    }
    if (!candidate.replayProtection?.queueUniqueness) {
      errors.push('MISSING_QUEUE_UNIQUENESS');
    }
    
    if (candidate.executionEligible) {
      errors.push('S2C_EXECUTION_PROHIBITED');
    }
    if (candidate.executionAuthorized) {
      errors.push('S2C_AUTHORIZATION_PROHIBITED');
    }

    // Verify serialization (no functions, no undefined)
    const serialized = JSON.stringify(candidate);
    if (!serialized) errors.push('SERIALIZATION_FAILURE');
    
    return {
      valid: errors.length === 0,
      errors: errors.sort(),
    };
  }
}
