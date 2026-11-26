import type {
  ActionDefinition,
  ActionPreview,
  ActionRequest,
  ActionReceipt,
  ActionSet,
  ApprovedAction,
} from "../../platform/connector-platform-sdk";

export const Microsoft365Actions: ActionSet = {
  supportedActions: [
    {
      id: "microsoft365_read",
      name: "Read Microsoft 365 Resources",
      description: "Read Microsoft Graph mail, file, site, and Teams metadata.",
      riskLevel: "low",
      requiresApproval: false,
      requiresFeatureFlag: false,
    },
    {
      id: "microsoft365_create",
      name: "Create Microsoft 365 Resource",
      description: "Create a governed Microsoft 365 resource.",
      riskLevel: "medium",
      requiresApproval: true,
      requiresFeatureFlag: true,
      featureFlagKey: "ENABLE_REAL_EXECUTION",
    },
  ] satisfies ActionDefinition[],
  async preview(action: ActionRequest): Promise<ActionPreview> {
    return {
      actionId: action.actionId,
      description: `Would prepare Microsoft 365 action ${action.actionId}.`,
      affectedResources: [],
      estimatedImpact: "None. Preview only.",
      riskWarnings:
        action.actionId === "microsoft365_create"
          ? ["Microsoft 365 writes require approval and execution flag gating."]
          : [],
      requiresApproval: action.actionId !== "microsoft365_read",
    };
  },
  async execute(action: ApprovedAction): Promise<ActionReceipt> {
    if (process.env.ENABLE_REAL_EXECUTION !== "true") {
      return {
        actionId: action.actionId,
        queueId: action.queueId,
        status: "queued",
        executedAt: action.approvedAt,
        auditId: `microsoft365-audit:${action.queueId}`,
      };
    }

    throw new Error("Microsoft 365 live execution is not implemented.");
  },
};
