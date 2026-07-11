import type {
  ActionDefinition,
  ActionPreview,
  ActionRequest,
  ActionReceipt,
  ActionSet,
  ApprovedAction,
} from "../../platform/connector-platform-sdk";

export const DropboxActions: ActionSet = {
  supportedActions: [
    {
      id: "dropbox_read",
      name: "Read Dropbox Metadata",
      description: "Read Dropbox file, folder, shared-link, and team-folder metadata.",
      riskLevel: "low",
      requiresApproval: false,
      requiresFeatureFlag: false,
    },
    {
      id: "dropbox_upload_file",
      name: "Upload Dropbox File",
      description: "Upload a governed Dropbox file.",
      riskLevel: "high",
      requiresApproval: true,
      requiresFeatureFlag: true,
      featureFlagKey: "ENABLE_REAL_EXECUTION",
    },
  ] satisfies ActionDefinition[],
  async preview(action: ActionRequest): Promise<ActionPreview> {
    return {
      actionId: action.actionId,
      description: `Would prepare Dropbox action ${action.actionId}.`,
      affectedResources: [],
      estimatedImpact: "None. Preview only.",
      riskWarnings:
        action.actionId === "dropbox_upload_file"
          ? ["Dropbox file writes require approval and execution flag gating."]
          : [],
      requiresApproval: action.actionId !== "dropbox_read",
    };
  },
  async execute(action: ApprovedAction): Promise<ActionReceipt> {
    if (process.env.ENABLE_REAL_EXECUTION !== "true") {
      return {
        actionId: action.actionId,
        queueId: action.queueId,
        status: "queued",
        executedAt: action.approvedAt,
        auditId: `dropbox-audit:${action.queueId}`,
      };
    }

    throw new Error("Dropbox live execution is not implemented.");
  },
};
