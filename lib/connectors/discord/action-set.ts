import type {
  ActionDefinition,
  ActionPreview,
  ActionRequest,
  ActionReceipt,
  ActionSet,
  ApprovedAction,
} from "../../platform/connector-platform-sdk";

export const DiscordActions: ActionSet = {
  supportedActions: [
    {
      id: "discord_read",
      name: "Read Discord Resources",
      description: "Read Discord guild, channel, and message metadata.",
      riskLevel: "low",
      requiresApproval: false,
      requiresFeatureFlag: false,
    },
    {
      id: "discord_create_message",
      name: "Create Discord Message",
      description: "Create a governed Discord message.",
      riskLevel: "medium",
      requiresApproval: true,
      requiresFeatureFlag: true,
      featureFlagKey: "ENABLE_REAL_EXECUTION",
    },
  ] satisfies ActionDefinition[],
  async preview(action: ActionRequest): Promise<ActionPreview> {
    return {
      actionId: action.actionId,
      description: `Would prepare Discord action ${action.actionId}.`,
      affectedResources: [],
      estimatedImpact: "None. Preview only.",
      riskWarnings:
        action.actionId === "discord_create_message"
          ? ["Discord writes require approval and execution flag gating."]
          : [],
      requiresApproval: action.actionId !== "discord_read",
    };
  },
  async execute(action: ApprovedAction): Promise<ActionReceipt> {
    if (process.env.ENABLE_REAL_EXECUTION !== "true") {
      return {
        actionId: action.actionId,
        queueId: action.queueId,
        status: "queued",
        executedAt: action.approvedAt,
        auditId: `discord-audit:${action.queueId}`,
      };
    }

    throw new Error("Discord live execution is not implemented.");
  },
};
