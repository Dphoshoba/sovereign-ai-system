import { GovernanceReviewRequest, GovernanceDecision, RiskLevel } from "./types";

export class PolicyEvaluator {
  static GOVERNANCE_VERSION = '1.0.0';
  static POLICY_VERSION = '1.0.0';

  /**
   * Evaluates a review request against global platform policies.
   * Strictly deterministic logic.
   */
  static evaluate(request: GovernanceReviewRequest): GovernanceDecision {
    const { securityContext, governanceContext, operation } = request;
    const policyResults: any[] = [];
    const blockingReasons: string[] = [];
    const warnings: string[] = [];
    const riskFactors: string[] = [];

    // --- POLICY EVALUATIONS ---

    // POLICY_SENSITIVE_RESOURCE: Restricted or Sensitive resources trigger warnings and high risk
    if (securityContext.classification === 'restricted' || securityContext.sensitiveResource) {
      policyResults.push({
        policyId: 'POLICY_SENSITIVE_RESOURCE',
        result: 'WARN',
        message: 'Sensitive resource interaction detected',
      });
      riskFactors.push('SENSITIVE_RESOURCE');
    }

    // POLICY_PUBLIC_SHARING: Public exposure is strictly prohibited
    if (securityContext.publicExposure) {
      policyResults.push({
        policyId: 'POLICY_PUBLIC_SHARING',
        result: 'FAIL',
        message: 'Public exposure is strictly prohibited',
      });
      blockingReasons.push('PUBLIC_EXPOSURE_PROHIBITED');
      riskFactors.push('PUBLIC_EXPOSURE');
    }

    // POLICY_OWNER_TRANSFER: Ownership changes are prohibited
    if (securityContext.ownership.proposed !== securityContext.ownership.current && securityContext.ownership.proposed !== null) {
      policyResults.push({
        policyId: 'POLICY_OWNER_TRANSFER',
        result: 'FAIL',
        message: 'Owner transfer is prohibited',
      });
      blockingReasons.push('OWNER_TRANSFER_PROHIBITED');
    }

    // POLICY_EXTERNAL_DOMAIN: External sharing requests a warning
    if (securityContext.externalSharing) {
      policyResults.push({
        policyId: 'POLICY_EXTERNAL_DOMAIN',
        result: 'WARN',
        message: 'External sharing request detected',
      });
      riskFactors.push('EXTERNAL_SHARING');
    }

    // POLICY_SCOPE_VALIDATION: Ensure required OAuth scopes are defined
    if (governanceContext.requiredScopes.length === 0) {
      policyResults.push({
        policyId: 'POLICY_SCOPE_VALIDATION',
        result: 'FAIL',
        message: 'No required OAuth scopes defined',
      });
      blockingReasons.push('MISSING_SCOPES');
    }

    // Deterministic Risk Scoring
    const riskLevel = this.calculateRiskLevel(riskFactors, blockingReasons);
    const approvalRequired = blockingReasons.length === 0 && (riskLevel === 'HIGH' || riskLevel === 'CRITICAL' || securityContext.sensitiveResource);
    const approvalLevel = this.determineApprovalLevel(riskLevel, securityContext.sensitiveResource);

    return {
      decisionId: `dec-${request.requestId}-${request.connectorId}`,
      requestId: request.requestId,
      governanceVersion: this.GOVERNANCE_VERSION,
      policyVersion: this.POLICY_VERSION,
      approvalRequired,
      approvalLevel,
      blockingReasons: blockingReasons.sort(),
      warnings: warnings.sort(),
      riskSummary: {
        level: riskLevel,
        factors: riskFactors.sort(),
      },
      policyResults: policyResults.sort((a, b) => a.policyId.localeCompare(b.policyId)),
      executionEligible: false,
      queueEligible: blockingReasons.length === 0,
      reviewerInstructions: `Review the proposed ${operation} for resource ${request.resourceId}. Focus on ${riskFactors.join(', ') || 'standard compliance'}.`,
    };
  }

  private static calculateRiskLevel(factors: string[], blocking: string[]): RiskLevel {
    if (blocking.length > 0) return 'CRITICAL';
    if (factors.includes('PUBLIC_EXPOSURE')) return 'CRITICAL';
    if (factors.includes('SENSITIVE_RESOURCE') || factors.includes('EXTERNAL_SHARING')) return 'HIGH';
    if (factors.length > 0) return 'MODERATE';
    return 'LOW';
  }

  private static determineApprovalLevel(risk: RiskLevel, sensitive: boolean): 'NONE' | 'STANDARD' | 'EXECUTIVE' | 'BOARD' {
    if (risk === 'CRITICAL') return 'BOARD';
    if (risk === 'HIGH' || sensitive) return 'EXECUTIVE';
    if (risk === 'MODERATE') return 'STANDARD';
    return 'NONE';
  }
}
