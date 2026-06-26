import { Prisma } from "@prisma/client"

import { prisma } from "../prisma"
import {
  buildOperatorAuditRecord,
  mapIntentToExistingAuditShape,
  type ExistingAuditShape,
  type OperatorAuditRecord,
} from "./operator-audit-contract"
import {
  getOperatorAction,
  type OperatorActionDefinition,
  type OperatorActionId,
  type OperatorActionRiskLevel,
} from "./operator-action-registry"

export const OPERATOR_INTENT_SOURCE = "ev-kos-operator" as const

export type OperatorIntentRisk = OperatorActionRiskLevel

export type OperatorIntentSafetyFlags = {
  actionExecuted: false
  graphWrites: false
  graphDeletes: false
  openAiCalls: false
  publishing: false
  socialPosting: false
  automaticApproval: false
}

export type OperatorIntentRequest = {
  explicitCreateIntent?: boolean
  actorId?: string | null
  actorRole?: string | null
  actionId?: string | null
  reason?: string | null
  source?: string | null
  inputs?: Record<string, unknown> | null
}

export type OperatorIntent = {
  id: string
  actorId: string
  actorRole: string
  actionId: OperatorActionId
  reason: string
  source: typeof OPERATOR_INTENT_SOURCE
  explicitCreateIntent: boolean
  risk: OperatorIntentRisk
  inputs: Record<string, unknown>
  safetyFlags: OperatorIntentSafetyFlags
}

export type OperatorIntentValidation = {
  valid: boolean
  errors: string[]
  warnings: string[]
  action: OperatorActionDefinition | null
}

export type OperatorIntentPersistenceResult = {
  ok: boolean
  previewOnly: boolean
  writesToPrisma: boolean
  model: "ExecutionAuthorizationRequest"
  intentId: string | null
  createdAuthorizationId: string | null
  validation: OperatorIntentValidation
  intent: OperatorIntent | null
  auditRecord: OperatorAuditRecord | null
  existingAuditShape: ExistingAuditShape | null
  safetyFlags: OperatorIntentSafetyFlags
  errors: string[]
  summary: string
}

export const OPERATOR_INTENT_SAFETY_FLAGS: OperatorIntentSafetyFlags = {
  actionExecuted: false,
  graphWrites: false,
  graphDeletes: false,
  openAiCalls: false,
  publishing: false,
  socialPosting: false,
  automaticApproval: false,
}

export function buildOperatorIntent(
  request: OperatorIntentRequest
): OperatorIntent | null {
  const validation = validateOperatorIntent(request)

  if (!validation.valid || !validation.action) return null

  return {
    id: `operator-intent:${validation.action.id}:${Date.now()}`,
    actorId: request.actorId!.trim(),
    actorRole: request.actorRole?.trim() || "ev-kos-operator",
    actionId: validation.action.id,
    reason: request.reason!.trim(),
    source: OPERATOR_INTENT_SOURCE,
    explicitCreateIntent: request.explicitCreateIntent === true,
    risk: classifyOperatorIntentRisk(validation.action),
    inputs: request.inputs && typeof request.inputs === "object" ? request.inputs : {},
    safetyFlags: OPERATOR_INTENT_SAFETY_FLAGS,
  }
}

export function validateOperatorIntent(
  request: OperatorIntentRequest
): OperatorIntentValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const action = request.actionId ? getOperatorAction(request.actionId) : null

  if (request.explicitCreateIntent !== true) {
    errors.push("explicitCreateIntent must be true.")
  }

  if (!request.actorId?.trim()) {
    errors.push("actorId is required.")
  }

  if (!request.actionId?.trim()) {
    errors.push("actionId is required.")
  } else if (!action) {
    errors.push(`actionId "${request.actionId}" is not registered.`)
  }

  if (!request.reason?.trim()) {
    errors.push("reason is required.")
  }

  if (request.source !== OPERATOR_INTENT_SOURCE) {
    errors.push(`source must be "${OPERATOR_INTENT_SOURCE}".`)
  }

  if (action?.riskLevel === "high") {
    warnings.push("High-risk operator intent requires later human review.")
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    action,
  }
}

export function classifyOperatorIntentRisk(
  action: OperatorActionDefinition
): OperatorIntentRisk {
  return action.riskLevel
}

export function summarizeOperatorIntent(
  result: Pick<
    OperatorIntentPersistenceResult,
    "ok" | "previewOnly" | "writesToPrisma" | "intentId" | "createdAuthorizationId" | "errors"
  >
) {
  if (!result.ok) {
    return `Operator intent blocked with ${result.errors.length} error(s).`
  }

  if (result.previewOnly) {
    return `Operator intent ${result.intentId} previewed only.`
  }

  return `Operator intent ${result.intentId} persisted as pending ExecutionAuthorizationRequest ${result.createdAuthorizationId}.`
}

export function previewOperatorIntent(
  request: OperatorIntentRequest
): OperatorIntentPersistenceResult {
  const validation = validateOperatorIntent({
    ...request,
    explicitCreateIntent: true,
    actorId: request.actorId ?? "operator-preview",
    actionId: request.actionId ?? "prepare-draft-preview",
    reason: request.reason ?? "Preview operator intent contract.",
    source: OPERATOR_INTENT_SOURCE,
  })
  const intent = buildOperatorIntent({
    ...request,
    explicitCreateIntent: true,
    actorId: request.actorId ?? "operator-preview",
    actionId: request.actionId ?? "prepare-draft-preview",
    reason: request.reason ?? "Preview operator intent contract.",
    source: OPERATOR_INTENT_SOURCE,
  })
  const action = validation.action
  const auditRecord = intent && action ? buildOperatorAuditRecord({ intent, action }) : null
  const existingAuditShape =
    intent && action && auditRecord
      ? mapIntentToExistingAuditShape({ intent, action, auditRecord })
      : null

  const result: OperatorIntentPersistenceResult = {
    ok: Boolean(intent && action),
    previewOnly: true,
    writesToPrisma: false,
    model: "ExecutionAuthorizationRequest",
    intentId: intent?.id ?? null,
    createdAuthorizationId: null,
    validation,
    intent,
    auditRecord,
    existingAuditShape,
    safetyFlags: OPERATOR_INTENT_SAFETY_FLAGS,
    errors: validation.errors,
    summary: "",
  }

  return {
    ...result,
    summary: summarizeOperatorIntent(result),
  }
}

export async function createOperatorIntent(
  request: OperatorIntentRequest
): Promise<OperatorIntentPersistenceResult> {
  const validation = validateOperatorIntent(request)

  if (!validation.valid || !validation.action) {
    const result: OperatorIntentPersistenceResult = {
      ok: false,
      previewOnly: true,
      writesToPrisma: false,
      model: "ExecutionAuthorizationRequest",
      intentId: null,
      createdAuthorizationId: null,
      validation,
      intent: null,
      auditRecord: null,
      existingAuditShape: null,
      safetyFlags: OPERATOR_INTENT_SAFETY_FLAGS,
      errors: validation.errors,
      summary: "",
    }

    return {
      ...result,
      summary: summarizeOperatorIntent(result),
    }
  }

  const intent = buildOperatorIntent(request)!
  const auditRecord = buildOperatorAuditRecord({
    intent,
    action: validation.action,
  })
  const existingAuditShape = mapIntentToExistingAuditShape({
    intent,
    action: validation.action,
    auditRecord,
  })
  const created = await prisma.executionAuthorizationRequest.create({
    data: {
      title: existingAuditShape.title,
      targetType: existingAuditShape.targetType,
      targetId: existingAuditShape.targetId,
      requestedBy: existingAuditShape.requestedBy,
      requestedRole: existingAuditShape.requestedRole,
      actionType: existingAuditShape.actionType,
      targetLayer: existingAuditShape.targetLayer,
      riskLevel: existingAuditShape.riskLevel,
      status: "pending",
      rationale: existingAuditShape.rationale,
      policyMatches: toInputJson(existingAuditShape.policyMatches),
      payload: toInputJson(existingAuditShape.payload),
    },
  })
  const result: OperatorIntentPersistenceResult = {
    ok: true,
    previewOnly: false,
    writesToPrisma: true,
    model: "ExecutionAuthorizationRequest",
    intentId: intent.id,
    createdAuthorizationId: created.id,
    validation,
    intent,
    auditRecord,
    existingAuditShape,
    safetyFlags: OPERATOR_INTENT_SAFETY_FLAGS,
    errors: [],
    summary: "",
  }

  return {
    ...result,
    summary: summarizeOperatorIntent(result),
  }
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}
