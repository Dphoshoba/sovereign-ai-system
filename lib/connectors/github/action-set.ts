import type {
  ActionDefinition,
  ActionPreview,
  ActionRequest,
  ActionReceipt,
  ActionSet,
  ApprovedAction,
} from "../../platform/connector-platform-sdk";

export const GitHubActions: ActionSet = {
  supportedActions: [
    {
      id: "github_read",
      name: "Read GitHub Resources",
      description: "Read repositories, issues, pull requests, and workflow metadata.",
      riskLevel: "low",
      requiresApproval: false,
      requiresFeatureFlag: false,
    },
    {
      id: "github_create_issue",
      name: "Create GitHub Issue",
      description: "Create a governed GitHub issue.",
      riskLevel: "medium",
      requiresApproval: true,
      requiresFeatureFlag: true,
      featureFlagKey: "ENABLE_REAL_EXECUTION",
    },
  ] satisfies ActionDefinition[],
  async preview(action: ActionRequest): Promise<ActionPreview> {
    return {
      actionId: action.actionId,
      description: `Would prepare GitHub action ${action.actionId}.`,
      affectedResources: [],
      estimatedImpact: "None. Preview only.",
      riskWarnings:
        action.actionId === "github_create_issue"
          ? ["GitHub writes require approval and execution flag gating."]
          : [],
      requiresApproval: action.actionId !== "github_read",
    };
  },
  async execute(action: ApprovedAction): Promise<ActionReceipt> {
    if (process.env.ENABLE_REAL_EXECUTION !== "true") {
      return {
        actionId: action.actionId,
        queueId: action.queueId,
        status: "queued",
        executedAt: action.approvedAt,
        auditId: `github-audit:${action.queueId}`,
      };
    }

    throw new Error("GitHub live execution is not implemented.");
  },
};
