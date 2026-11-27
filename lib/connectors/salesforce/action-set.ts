import type {
  ActionDefinition,
  ActionPreview,
  ActionRequest,
  ActionReceipt,
  ActionSet,
  ApprovedAction,
} from "../../platform/connector-platform-sdk";

export const SalesforceActions: ActionSet = {
  supportedActions: [
    {
      id: "salesforce_read",
      name: "Read Salesforce Records",
      description: "Read Salesforce account, contact, opportunity, and case metadata.",
      riskLevel: "low",
      requiresApproval: false,
      requiresFeatureFlag: false,
    },
    {
      id: "salesforce_create_record",
      name: "Create Salesforce Record",
      description: "Create a governed Salesforce CRM record.",
      riskLevel: "high",
      requiresApproval: true,
      requiresFeatureFlag: true,
      featureFlagKey: "ENABLE_REAL_EXECUTION",
    },
  ] satisfies ActionDefinition[],
  async preview(action: ActionRequest): Promise<ActionPreview> {
    return {
      actionId: action.actionId,
      description: `Would prepare Salesforce action ${action.actionId}.`,
      affectedResources: [],
      estimatedImpact: "None. Preview only.",
      riskWarnings:
        action.actionId === "salesforce_create_record"
          ? ["Salesforce record creation requires approval and execution flag gating."]
          : [],
      requiresApproval: action.actionId !== "salesforce_read",
    };
  },
  async execute(action: ApprovedAction): Promise<ActionReceipt> {
    if (process.env.ENABLE_REAL_EXECUTION !== "true") {
      return {
        actionId: action.actionId,
        queueId: action.queueId,
        status: "queued",
        executedAt: action.approvedAt,
        auditId: `salesforce-audit:${action.queueId}`,
      };
    }

    throw new Error("Salesforce live execution is not implemented.");
  },
};
