import type {
  ActionDefinition,
  ActionPreview,
  ActionRequest,
  ActionReceipt,
  ActionSet,
  ApprovedAction,
} from "../../platform/connector-platform-sdk";

export const DriveActions: ActionSet = {
  supportedActions: [
    {
      id: "drive_read",
      name: "Read Drive Metadata",
      description: "Read Google Drive file and folder metadata.",
      riskLevel: "low",
      requiresApproval: false,
      requiresFeatureFlag: false,
    },
    {
      id: "drive_create",
      name: "Create Drive File",
      description: "Create a governed Google Drive file.",
      riskLevel: "medium",
      requiresApproval: true,
      requiresFeatureFlag: true,
      featureFlagKey: "ENABLE_REAL_EXECUTION",
    },
  ] satisfies ActionDefinition[],
  async preview(action: ActionRequest): Promise<ActionPreview> {
    return {
      actionId: action.actionId,
      description: `Would prepare Drive action ${action.actionId}.`,
      affectedResources: [],
      estimatedImpact: "None. Preview only.",
      riskWarnings:
        action.actionId === "drive_create"
          ? ["Drive writes require approval and execution flag gating."]
          : [],
      requiresApproval: action.actionId !== "drive_read",
    };
  },
  async execute(action: ApprovedAction): Promise<ActionReceipt> {
    if (process.env.ENABLE_REAL_EXECUTION !== "true") {
      return {
        actionId: action.actionId,
        queueId: action.queueId,
        status: "queued",
        executedAt: action.approvedAt,
        auditId: `drive-audit:${action.queueId}`,
      };
    }

    throw new Error("Drive live execution is not implemented.");
  },
};
