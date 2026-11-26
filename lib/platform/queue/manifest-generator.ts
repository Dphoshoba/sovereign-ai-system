import { ExecutionManifest, DependencyGraph } from "./types";
import { GovernanceDecision } from "../governance/types";
import { MutationPreview } from "../../connectors/drive/mutation-preview";

export class ManifestGenerator {
  /**
   * Produces a deterministic execution manifest for the queue.
   */
  static generateManifest(
    preview: MutationPreview,
    decision: GovernanceDecision
  ): ExecutionManifest {
    return {
      intendedOperation: preview.operation,
      requiredScopes: preview.governance.requiredScopes,
      requiredApprovals: [decision.approvalLevel].filter(v => v !== 'NONE'),
      governanceDecisionId: decision.decisionId,
      blockingConditions: decision.blockingReasons,
      validationSummary: preview.execution.changeSummary,
      resourceSummary: {
        sourceId: preview.resourceId ?? null,
        targetId: preview.proposedState?.id ?? null,
        resourceType: 'google-drive-resource',
      },
      executionPrerequisites: [], // To be populated by dependency analysis in S2C
    };
  }

  /**
   * Generates a deterministic dependency relationship.
   */
  static generateDependencyGraph(
    preview: MutationPreview,
    prevOps: string[] = []
  ): DependencyGraph {
    // Example: if this is a MOVE, it might depend on a RENAME completing first
    const dependsOn = [];
    if (preview.operation === 'move' && prevOps.includes('rename')) {
      dependsOn.push('rename-op-id'); // Simplified for Stage 2C
    }
    
    return {
      dependsOn: dependsOn.sort(),
      executionOrder: prevOps.length + 1,
    };
  }
}
