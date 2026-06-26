import type { OperatorActionDefinition } from "./operator-action-registry"
import type { OperatorIntent, OperatorIntentRisk } from "./operator-intent"

export type OperatorAuditRecord = {
  eventType: "EV_KOS_OPERATOR_INTENT"
  actor: string
  actorRole: string
  targetType: "OperatorAction"
  targetId: string
  action: string
  outcome: "pending_review"
  severity: OperatorIntentRisk
  details: {
    intentId: string
    actionId: string
    reason: string
    source: "ev-kos-operator"
    actionExecuted: false
    graphWrites: false
    graphDeletes: false
    openAiCalls: false
    publishing: false
    socialPosting: false
    automaticApproval: false
  }
}

export type ExistingAuditShape = {
  model: "ExecutionAuthorizationRequest"
  title: string
  targetType: string
  targetId: string
  requestedBy: string
  requestedRole: string
  actionType: string
  targetLayer: string
  riskLevel: string
  status: "pending"
  rationale: string
  policyMatches: Record<string, unknown>
  payload: Record<string, unknown>
}

export function buildOperatorAuditRecord(input: {
  intent: OperatorIntent
  action: OperatorActionDefinition
}): OperatorAuditRecord {
  return {
    eventType: "EV_KOS_OPERATOR_INTENT",
    actor: input.intent.actorId,
    actorRole: input.intent.actorRole,
    targetType: "OperatorAction",
    targetId: input.action.id,
    action: input.action.name,
    outcome: "pending_review",
    severity: input.intent.risk,
    details: {
      intentId: input.intent.id,
      actionId: input.action.id,
      reason: input.intent.reason,
      source: "ev-kos-operator",
      actionExecuted: false,
      graphWrites: false,
      graphDeletes: false,
      openAiCalls: false,
      publishing: false,
      socialPosting: false,
      automaticApproval: false,
    },
  }
}

export function mapIntentToExistingAuditShape(input: {
  intent: OperatorIntent
  action: OperatorActionDefinition
  auditRecord: OperatorAuditRecord
}): ExistingAuditShape {
  return {
    model: "ExecutionAuthorizationRequest",
    title: `EV-KOS operator intent: ${input.action.name}`,
    targetType: "OperatorAction",
    targetId: input.action.id,
    requestedBy: input.intent.actorId,
    requestedRole: input.intent.actorRole,
    actionType: `ev-kos.operator.${input.action.id}`,
    targetLayer: "ev-kos-operator",
    riskLevel: input.intent.risk,
    status: "pending",
    rationale: input.intent.reason,
    policyMatches: {
      source: input.intent.source,
      explicitCreateIntent: input.intent.explicitCreateIntent,
      requiredApprovals: input.action.requiredApprovals,
      requiredPermissions: input.action.requiredPermissions,
      executionMode: input.action.executionMode,
    },
    payload: {
      intent: input.intent,
      auditRecord: input.auditRecord,
      actionSummary: input.action,
      safetyFlags: input.intent.safetyFlags,
      createdByPhase: "phase-7d-operator-intent-audit",
    },
  }
}
