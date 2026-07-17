import { GovernanceDecision, GovernanceReviewRequest } from "./types";

export class ReviewPackageGenerator {
  /**
   * Generates a human-reviewable artifact for the governance board.
   * Purely deterministic.
   */
  static generate(request: GovernanceReviewRequest, decision: GovernanceDecision): any {
    return {
      packageId: `pkg-${decision.decisionId}`,
      timestamp: '2026-01-01T00:00:00Z', // Deterministic placeholder
      governanceVersion: decision.governanceVersion,
      policyVersion: decision.policyVersion,
      summary: {
        operation: request.operation,
        connector: request.connectorId,
        riskLevel: decision.riskSummary.level,
      },
      impactAnalysis: {
        proposedChanges: request.proposedChanges,
        securityClassification: request.securityContext.classification,
        permissionDelta: request.securityContext.permissionDelta,
        exposureRisk: request.securityContext.publicExposure ? 'CRITICAL' : 'NONE',
      },
      governanceAudit: {
        policyResults: decision.policyResults,
        blockingReasons: decision.blockingReasons,
        warnings: decision.warnings,
        approvalLevel: decision.approvalLevel,
      },
      instructions: decision.reviewerInstructions,
      eligibility: {
        queueEligible: decision.queueEligible,
        executionAllowed: decision.executionEligible,
      },
    };
  }
}
