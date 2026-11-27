import type {
  ActionDefinition,
  ActionPreview,
  ActionRequest,
  ActionReceipt,
  ActionSet,
  ApprovedAction,
} from "../../platform/connector-platform-sdk";

export const NotionActions: ActionSet = {
  supportedActions: [
    {
      id: "notion_read",
      name: "Read Notion Resources",
      description: "Read Notion pages, databases, and blocks.",
      riskLevel: "low",
      requiresApproval: false,
      requiresFeatureFlag: false,
    },
    {
      id: "notion_create_page",
      name: "Create Notion Page",
      description: "Create a governed Notion page.",
      riskLevel: "medium",
      requiresApproval: true,
      requiresFeatureFlag: true,
      featureFlagKey: "ENABLE_REAL_EXECUTION",
    },
  ] satisfies ActionDefinition[],
  async preview(action: ActionRequest): Promise<ActionPreview> {
    return {
      actionId: action.actionId,
      description: `Would prepare Notion action ${action.actionId}.`,
      affectedResources: [],
      estimatedImpact: "None. Preview only.",
      riskWarnings:
        action.actionId === "notion_create_page"
          ? ["Notion writes require approval and execution flag gating."]
          : [],
      requiresApproval: action.actionId !== "notion_read",
    };
  },
  async execute(action: ApprovedAction): Promise<ActionReceipt> {
    if (process.env.ENABLE_REAL_EXECUTION !== "true") {
      return {
        actionId: action.actionId,
        queueId: action.queueId,
        status: "queued",
        executedAt: action.approvedAt,
        auditId: `notion-audit:${action.queueId}`,
      };
    }

    throw new Error("Notion live execution is not implemented.");
  },
};
