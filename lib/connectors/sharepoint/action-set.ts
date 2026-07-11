import type {
  ActionDefinition,
  ActionPreview,
  ActionRequest,
  ActionReceipt,
  ActionSet,
  ApprovedAction,
} from "../../platform/connector-platform-sdk";

export const SharePointActions: ActionSet = {
  supportedActions: [
    {
      id: "sharepoint_read",
      name: "Read SharePoint Metadata",
      description: "Read SharePoint site, list, list-item, and document-library metadata.",
      riskLevel: "low",
      requiresApproval: false,
      requiresFeatureFlag: false,
    },
    {
      id: "sharepoint_create_list_item",
      name: "Create SharePoint List Item",
      description: "Create a governed SharePoint list item.",
      riskLevel: "high",
      requiresApproval: true,
      requiresFeatureFlag: true,
      featureFlagKey: "ENABLE_REAL_EXECUTION",
    },
  ] satisfies ActionDefinition[],
  async preview(action: ActionRequest): Promise<ActionPreview> {
    return {
      actionId: action.actionId,
      description: `Would prepare SharePoint action ${action.actionId}.`,
      affectedResources: [],
      estimatedImpact: "None. Preview only.",
      riskWarnings:
        action.actionId === "sharepoint_create_list_item"
          ? ["SharePoint list writes require approval and execution flag gating."]
          : [],
      requiresApproval: action.actionId !== "sharepoint_read",
    };
  },
  async execute(action: ApprovedAction): Promise<ActionReceipt> {
    if (process.env.ENABLE_REAL_EXECUTION !== "true") {
      return {
        actionId: action.actionId,
        queueId: action.queueId,
        status: "queued",
        executedAt: action.approvedAt,
        auditId: `sharepoint-audit:${action.queueId}`,
      };
    }

    throw new Error("SharePoint live execution is not implemented.");
  },
};
