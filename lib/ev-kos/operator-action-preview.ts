import { buildEVKOSOperatorDashboard } from "./operator-dashboard"
import {
  getOperatorAction,
  listOperatorActions,
  summarizeOperatorActions,
  type OperatorActionDefinition,
} from "./operator-action-registry"
import {
  OPERATOR_ACTION_SAFETY_FLAGS,
  validateOperatorActionPreview,
  type OperatorActionPreviewInput,
  type OperatorActionValidationResult,
} from "./operator-action-validator"

export type OperatorActionPreview = {
  ok: boolean
  previewOnly: true
  actionSummary: OperatorActionDefinition | null
  validation: OperatorActionValidationResult | null
  affectedSystems: string[]
  affectedAssets: string[]
  governanceChecks: string[]
  approvalRequirements: string[]
  safetyFlags: typeof OPERATOR_ACTION_SAFETY_FLAGS
  expectedOutcome: string
  execution: false
}

export function buildOperatorActionPreview(
  input: OperatorActionPreviewInput
): OperatorActionPreview {
  const action = getOperatorAction(input.actionId)

  if (!action) {
    return {
      ok: false,
      previewOnly: true,
      actionSummary: null,
      validation: null,
      affectedSystems: [],
      affectedAssets: [],
      governanceChecks: [
        "Action must exist in the governed operator action registry.",
      ],
      approvalRequirements: [],
      safetyFlags: OPERATOR_ACTION_SAFETY_FLAGS,
      expectedOutcome: "No preview available for unknown action.",
      execution: false,
    }
  }

  const validation = validateOperatorActionPreview(action, input)

  return {
    ok: true,
    previewOnly: true,
    actionSummary: action,
    validation,
    affectedSystems: action.affectedSystems,
    affectedAssets: affectedAssetsFor(action.id, input),
    governanceChecks: [
      "Execution mode is preview-only.",
      "Operator permissions are validated before preview readiness.",
      "Human approvals remain separate from preview readiness.",
      "No automatic approval, publication, graph write, or generation path is exposed.",
    ],
    approvalRequirements: action.requiredApprovals,
    safetyFlags: OPERATOR_ACTION_SAFETY_FLAGS,
    expectedOutcome: expectedOutcomeFor(action, validation),
    execution: false,
  }
}

export function buildOperatorActionDashboard() {
  const actions = listOperatorActions()
  const previews = actions.map((action) =>
    buildOperatorActionPreview({
      actionId: action.id,
      operatorId: "operator-preview",
      permissions: action.requiredPermissions,
      inputs: defaultInputsFor(action),
    })
  )
  const readyActions = previews.filter(
    (preview) => preview.validation?.status === "READY_FOR_PREVIEW"
  )
  const actionsRequiringApproval = previews.filter(
    (preview) => preview.validation?.status === "REQUIRES_APPROVAL"
  )
  const blockedActions = previews.filter(
    (preview) => preview.validation?.status === "BLOCKED"
  )
  const operatorDashboard = buildEVKOSOperatorDashboard()

  return {
    ok: true,
    readOnly: true,
    previewOnly: true,
    execution: false,
    writesToPrisma: false,
    graphWrites: false,
    graphDeletes: false,
    openAiCalls: false,
    publishing: false,
    socialPosting: false,
    automaticApprovals: false,
    summary: {
      ...summarizeOperatorActions(actions),
      ready: readyActions.length,
      requiringApproval: actionsRequiringApproval.length,
      blocked: blockedActions.length,
      dashboardReadinessScore: operatorDashboard.readinessScore,
    },
    availableActions: previews,
    readyActions: readyActions.map((preview) => preview.actionSummary),
    actionsRequiringApproval: actionsRequiringApproval.map(
      (preview) => preview.actionSummary
    ),
    blockedActions: blockedActions.map((preview) => preview.actionSummary),
    validationMessages: previews.flatMap(
      (preview) => preview.validation?.validationMessages ?? []
    ),
    safetyFlags: OPERATOR_ACTION_SAFETY_FLAGS,
  }
}

function defaultInputsFor(action: OperatorActionDefinition) {
  return Object.fromEntries(
    action.requiredInputs
      .filter((input) => input !== "operatorId")
      .map((input) => [input, `preview-${input}`])
  )
}

function affectedAssetsFor(
  actionId: OperatorActionDefinition["id"],
  input: OperatorActionPreviewInput
) {
  const inputs = input.inputs ?? {}

  switch (actionId) {
    case "prepare-draft-preview":
    case "validate-campaign":
    case "prepare-publication":
      return [String(inputs.campaignId ?? "preview-campaign")]
    case "build-review-package":
      return [String(inputs.reviewItemId ?? "preview-review-item")]
    case "start-research-mission":
    case "view-mission-health":
      return [String(inputs.missionId ?? "preview-mission")]
    default:
      return ["operator-dashboard"]
  }
}

function expectedOutcomeFor(
  action: OperatorActionDefinition,
  validation: OperatorActionValidationResult
) {
  if (validation.status === "BLOCKED") {
    return `Preview is blocked until ${[
      ...validation.missingInputs,
      ...validation.missingPermissions,
    ].join(", ")} are provided.`
  }

  if (validation.status === "REQUIRES_APPROVAL") {
    return `${action.name} can be previewed, but human approval remains required before any future execution path.`
  }

  return `${action.name} is ready for preview. No execution will occur.`
}
