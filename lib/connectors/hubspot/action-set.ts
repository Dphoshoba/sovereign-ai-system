import type {
  ActionDefinition,
  ActionPreview,
  ActionRequest,
  ActionReceipt,
  ActionSet,
  ApprovedAction,
} from "../../platform/connector-platform-sdk";

export const HubSpotActions: ActionSet = {
  supportedActions: [
    {
      id: "hubspot_read",
      name: "Read HubSpot Records",
      description: "Read HubSpot contact, company, deal, and ticket metadata.",
      riskLevel: "low",
      requiresApproval: false,
      requiresFeatureFlag: false,
    },
    {
      id: "hubspot_create_record",
      name: "Create HubSpot Record",
      description: "Create a governed HubSpot CRM record.",
      riskLevel: "high",
      requiresApproval: true,
      requiresFeatureFlag: true,
      featureFlagKey: "ENABLE_REAL_EXECUTION",
    },
  ] satisfies ActionDefinition[],
  async preview(action: ActionRequest): Promise<ActionPreview> {
    return {
      actionId: action.actionId,
      description: `Would prepare HubSpot action ${action.actionId}.`,
      affectedResources: [],
      estimatedImpact: "None. Preview only.",
      riskWarnings:
        action.actionId === "hubspot_create_record"
          ? ["HubSpot CRM writes require approval and execution flag gating."]
          : [],
      requiresApproval: action.actionId !== "hubspot_read",
    };
  },
  async execute(action: ApprovedAction): Promise<ActionReceipt> {
    if (process.env.ENABLE_REAL_EXECUTION !== "true") {
      return {
        actionId: action.actionId,
        queueId: action.queueId,
        status: "queued",
        executedAt: action.approvedAt,
        auditId: `hubspot-audit:${action.queueId}`,
      };
    }

    throw new Error("HubSpot live execution is not implemented.");
  },
};
