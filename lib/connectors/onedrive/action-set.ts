import type {
  ActionDefinition,
  ActionPreview,
  ActionRequest,
  ActionReceipt,
  ActionSet,
  ApprovedAction,
} from "../../platform/connector-platform-sdk";

export const OneDriveActions: ActionSet = {
  supportedActions: [
    {
      id: "onedrive_read",
      name: "Read OneDrive Metadata",
      description: "Read OneDrive file, folder, drive, and shortcut metadata.",
      riskLevel: "low",
      requiresApproval: false,
      requiresFeatureFlag: false,
    },
    {
      id: "onedrive_upload_file",
      name: "Upload OneDrive File",
      description: "Upload a governed OneDrive file.",
      riskLevel: "high",
      requiresApproval: true,
      requiresFeatureFlag: true,
      featureFlagKey: "ENABLE_REAL_EXECUTION",
    },
  ] satisfies ActionDefinition[],
  async preview(action: ActionRequest): Promise<ActionPreview> {
    return {
      actionId: action.actionId,
      description: `Would prepare OneDrive action ${action.actionId}.`,
      affectedResources: [],
      estimatedImpact: "None. Preview only.",
      riskWarnings:
        action.actionId === "onedrive_upload_file"
          ? ["OneDrive file writes require approval and execution flag gating."]
          : [],
      requiresApproval: action.actionId !== "onedrive_read",
    };
  },
  async execute(action: ApprovedAction): Promise<ActionReceipt> {
    if (process.env.ENABLE_REAL_EXECUTION !== "true") {
      return {
        actionId: action.actionId,
        queueId: action.queueId,
        status: "queued",
        executedAt: action.approvedAt,
        auditId: `onedrive-audit:${action.queueId}`,
      };
    }

    throw new Error("OneDrive live execution is not implemented.");
  },
};
