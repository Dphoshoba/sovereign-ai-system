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
    if (!candidate.decisionId) errors.push('MISSING_DECISION_ID');
    if (!candidate.previewId) errors.push('MISSING_PREVIEW_ID');
    if (!candidate.idempotencyToken) errors.push('MISSING_IDEMPOTENCY_TOKEN');
    
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
