import { MutationPreview } from "../../connectors/drive/mutation-preview";
import { GovernanceReviewRequest } from "./types";

export class GovernanceAdapter {
  /**
   * Converts a connector-specific MutationPreview into a platform-neutral 
   * GovernanceReviewRequest.
   */
  static toReviewRequest(preview: MutationPreview): GovernanceReviewRequest {
    return {
      requestId: preview.previewId.includes('-req-') 
        ? preview.previewId.split('-req-')[1] 
        : preview.previewId.split('-').pop() || 'unknown',
      connectorId: preview.connectorId,
      operation: preview.operation,
      resourceId: preview.resourceId,
      proposedChanges: preview.proposedState,
      securityContext: {
        classification: preview.security.classification.classification,
        mimeType: preview.security.mimeClassification,
        ownership: {
          current: preview.security.ownershipAnalysis.currentOwner,
          proposed: preview.security.ownershipAnalysis.proposedOwner,
        },
        permissionDelta: preview.security.proposedPermissionDelta,
        publicExposure: preview.governance.riskFactors.some(r => r.includes('public exposure')),
        externalSharing: preview.security.externalSharingImpact !== 'None',
        sensitiveResource: preview.security.sensitiveResourceImpact !== 'Low',
      },
      governanceContext: {
        duplicatesDetected: preview.governance.duplicateConflictFindings.length > 0,
        versionImpact: preview.governance.versionImpact,
        requiredScopes: preview.governance.requiredScopes,
      },
      metadata: {
        generatedAt: new Date().toISOString(), // This will be replaced by deterministic logic for full certification
        version: '1.0.0',
      },
    };
  }
}
