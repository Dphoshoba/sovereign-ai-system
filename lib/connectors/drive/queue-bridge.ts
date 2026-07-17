import { QueueCandidate } from "../../platform/queue/types";
import { GovernanceDecision } from "../../platform/governance/types";
import { MutationPreview } from "./mutation-preview";
import { QueueTokenService } from "../../platform/queue/token-service";
import { ManifestGenerator } from "../../platform/queue/manifest-generator";

export class DriveQueueBridge {
  /**
   * Bridges a Drive MutationPreview and GovernanceDecision into a 
   * connector-neutral QueueCandidate.
   */
  static generateCandidate(
    preview: MutationPreview,
    decision: GovernanceDecision
  ): QueueCandidate {
    const idempotencyToken = QueueTokenService.generateIdempotencyToken(
      preview.connectorId,
      preview.operation,
      preview.resourceId,
      decision.decisionId
    );

    const replayProtection = QueueTokenService.generateReplayProtection(
      preview.connectorId,
      preview.previewId
    );

    const manifest = ManifestGenerator.generateManifest(preview, decision);
    const dependencies = ManifestGenerator.generateDependencyGraph(preview);

    return {
      queueId: `q-drive-${preview.previewId}-${decision.decisionId}`,
      connectorId: preview.connectorId,
      operation: preview.operation,
      previewId: preview.previewId,
      decisionId: decision.decisionId,
      reviewPackageId: `pkg-${decision.decisionId}`,
      governanceVersion: decision.governanceVersion,
      policyVersion: decision.policyVersion,
      executionManifest: manifest,
      idempotencyToken: idempotencyToken,
      replayProtection: replayProtection,
      dependencyGraph: dependencies,
      auditReference: `audit-drive-${preview.previewId}`,
      queueEligible: decision.queueEligible,
      executionEligible: false,
      executionAuthorized: false,
      metadata: {
        generatedAt: '2026-01-01T00:00:00Z', // Deterministic placeholder
        version: '1.0.0',
      },
    };
  }
}
