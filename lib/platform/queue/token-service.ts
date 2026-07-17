import { QueueCandidate, IdempotencyToken, ReplayProtection } from "./types";
import { GovernanceDecision } from "../governance/types";
import { MutationPreview } from "../../connectors/drive/mutation-preview";

export class QueueTokenService {
  /**
   * Generates a deterministic idempotency token.
   * Input: connectorId, operation, resourceId, decisionId.
   * Strategy: stable concatenation + simple hash (simulated for pure JS).
   */
  static generateIdempotencyToken(
    connectorId: string,
    operation: string,
    resourceId: string | undefined,
    decisionId: string
  ): IdempotencyToken {
    const parts = [connectorId, operation, resourceId || 'none', decisionId];
    const seed = parts.join('|');
    // Using a simple deterministic hash to avoid randoms/timestamps
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return `idemp-${Math.abs(hash).toString(16).padStart(8, '0')}`;
  }

  /**
   * Generates deterministic replay protection metadata.
   */
  static generateReplayProtection(
    connectorId: string,
    previewId: string
  ): ReplayProtection {
    const detectionKey = `dup-${connectorId}-${previewId}`;
    return {
      duplicateDetectionKey: detectionKey,
      replayWindowMetadata: {
        windowStart: '2026-01-01T00:00:00Z', // Deterministic placeholder
        windowEnd: '2026-01-01T23:59:59Z',
      },
      conflictIdentity: `conflict-${connectorId}-${previewId}`,
      queueUniqueness: `unique-${connectorId}-${previewId}`,
    };
  }
}
