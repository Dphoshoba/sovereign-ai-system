import type {
  OperatorActionDefinition,
  OperatorActionRiskLevel,
} from "./operator-action-registry"

export type OperatorActionSafetyFlags = {
  execution: false
  writesToPrisma: false
  graphWrites: false
  graphDeletes: false
  openAiCalls: false
  publishing: false
  socialPosting: false
  automaticApprovals: false
}

export type OperatorActionValidationStatus =
  | "READY_FOR_PREVIEW"
  | "REQUIRES_APPROVAL"
  | "BLOCKED"

export type OperatorActionValidationResult = {
  actionId: string
  status: OperatorActionValidationStatus
  ready: boolean
  missingInputs: string[]
  missingPermissions: string[]
  approvalRequirements: string[]
  validationMessages: string[]
  riskLevel: OperatorActionRiskLevel
  safetyFlags: OperatorActionSafetyFlags
}

export type OperatorActionPreviewInput = {
  actionId: string
  operatorId?: string
  permissions?: string[]
  inputs?: Record<string, string | number | boolean | null | undefined>
}

export const OPERATOR_ACTION_SAFETY_FLAGS: OperatorActionSafetyFlags = {
  execution: false,
  writesToPrisma: false,
  graphWrites: false,
  graphDeletes: false,
  openAiCalls: false,
  publishing: false,
  socialPosting: false,
  automaticApprovals: false,
}

export function validateOperatorActionPreview(
  action: OperatorActionDefinition,
  previewInput: OperatorActionPreviewInput
): OperatorActionValidationResult {
  const permissions = new Set(previewInput.permissions ?? [])
  const inputs = previewInput.inputs ?? {}
  const missingInputs = action.requiredInputs.filter((input) => {
    if (input === "operatorId" && previewInput.operatorId) return false

    return inputs[input] === undefined || inputs[input] === null || inputs[input] === ""
  })
  const missingPermissions = action.requiredPermissions.filter(
    (permission) => !permissions.has(permission)
  )
  const validationMessages = [
    "Preview mode only; execution is not available.",
    "No write, generation, graph, approval, publication, or social posting operation will run.",
  ]

  if (missingInputs.length > 0) {
    validationMessages.push(
      `Missing required inputs: ${missingInputs.join(", ")}.`
    )
  }

  if (missingPermissions.length > 0) {
    validationMessages.push(
      `Missing required permissions: ${missingPermissions.join(", ")}.`
    )
  }

  if (action.requiredApprovals.length > 0) {
    validationMessages.push(
      `Human approval required: ${action.requiredApprovals.join(", ")}.`
    )
  }

  const blocked = missingInputs.length > 0 || missingPermissions.length > 0
  const status: OperatorActionValidationStatus = blocked
    ? "BLOCKED"
    : action.requiredApprovals.length > 0
      ? "REQUIRES_APPROVAL"
      : "READY_FOR_PREVIEW"

  return {
    actionId: action.id,
    status,
    ready: status !== "BLOCKED",
    missingInputs,
    missingPermissions,
    approvalRequirements: action.requiredApprovals,
    validationMessages,
    riskLevel: action.riskLevel,
    safetyFlags: OPERATOR_ACTION_SAFETY_FLAGS,
  }
}
