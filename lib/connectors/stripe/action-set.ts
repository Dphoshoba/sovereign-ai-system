import type {
  ActionDefinition,
  ActionPreview,
  ActionRequest,
  ActionReceipt,
  ActionSet,
  ApprovedAction,
} from "../../platform/connector-platform-sdk";

export const StripeActions: ActionSet = {
  supportedActions: [
    {
      id: "stripe_read",
      name: "Read Stripe Resources",
      description: "Read Stripe customer, invoice, subscription, and payment metadata.",
      riskLevel: "low",
      requiresApproval: false,
      requiresFeatureFlag: false,
    },
    {
      id: "stripe_create_invoice",
      name: "Create Stripe Invoice",
      description: "Create a governed Stripe invoice draft.",
      riskLevel: "high",
      requiresApproval: true,
      requiresFeatureFlag: true,
      featureFlagKey: "ENABLE_REAL_EXECUTION",
    },
  ] satisfies ActionDefinition[],
  async preview(action: ActionRequest): Promise<ActionPreview> {
    return {
      actionId: action.actionId,
      description: `Would prepare Stripe action ${action.actionId}.`,
      affectedResources: [],
      estimatedImpact: "None. Preview only.",
      riskWarnings:
        action.actionId === "stripe_create_invoice"
          ? ["Stripe financial actions require approval and execution flag gating."]
          : [],
      requiresApproval: action.actionId !== "stripe_read",
    };
  },
  async execute(action: ApprovedAction): Promise<ActionReceipt> {
    if (process.env.ENABLE_REAL_EXECUTION !== "true") {
      return {
        actionId: action.actionId,
        queueId: action.queueId,
        status: "queued",
        executedAt: action.approvedAt,
        auditId: `stripe-audit:${action.queueId}`,
      };
    }

    throw new Error("Stripe live execution is not implemented.");
  },
};
