import { Prisma } from "@prisma/client"

import { prisma } from "../prisma"
import {
  mapReviewItemsToExistingApprovalShape,
  type ExistingApprovalShape,
  type IngestionReviewQueueItem,
} from "./ingestion-review-queue"

export const INGESTION_REVIEW_PACKAGE_SOURCE =
  "semantic-graph-ingestion-review"

export type IngestionReviewPackageRequest = {
  explicitCreatePackage?: boolean
  actorId?: string | null
  organizationId?: string | null
  workspaceId?: string | null
  source?: string | null
  requestedRole?: string | null
  reason?: string | null
  items?: IngestionReviewQueueItem[]
}

export type ExecutionAuthorizationPayload = ExistingApprovalShape & {
  requestedBy: string
  requestedRole: string | null
  status: "pending"
  payload: Record<string, unknown>
}

export type ReviewPackageValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export type IngestionReviewPackageResult = {
  ok: boolean
  writesToPrisma: boolean
  graphWrites: false
  graphDeletes: false
  databaseAccess: boolean
  model: "ExecutionAuthorizationRequest"
  createdPackageIds: string[]
  createdPackages: Array<{
    id: string
    title: string
    status: string
    targetType: string
    targetId: string | null
    actionType: string
    riskLevel: string
  }>
  errors: string[]
  warnings: string[]
  summary: string
}

export function buildExecutionAuthorizationPayload(
  item: IngestionReviewQueueItem,
  request?: Pick<
    IngestionReviewPackageRequest,
    "actorId" | "organizationId" | "workspaceId" | "source" | "requestedRole" | "reason"
  >
): ExecutionAuthorizationPayload {
  const [shape] = mapReviewItemsToExistingApprovalShape([item])

  return {
    ...shape,
    requestedBy: request?.actorId ?? item.requestedBy,
    requestedRole: request?.requestedRole ?? "semantic-graph-operator",
    status: "pending",
    payload: {
      ...shape.payload,
      reviewItem: item,
      packageSource: request?.source ?? INGESTION_REVIEW_PACKAGE_SOURCE,
      organizationId: request?.organizationId ?? null,
      workspaceId: request?.workspaceId ?? null,
      packageReason: request?.reason ?? null,
      graphWrites: false,
      graphDeletes: false,
      createdByPhase: "phase-4e-slice-2",
    },
  }
}

export function validateReviewPackageRequest(
  request: IngestionReviewPackageRequest
): ReviewPackageValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (request.explicitCreatePackage !== true) {
    errors.push("explicitCreatePackage must be true.")
  }

  if (!request.actorId?.trim()) {
    errors.push("actorId is required.")
  }

  if (!request.organizationId?.trim()) {
    errors.push("organizationId is required.")
  }

  if (request.source !== INGESTION_REVIEW_PACKAGE_SOURCE) {
    errors.push(
      `source must be "${INGESTION_REVIEW_PACKAGE_SOURCE}".`
    )
  }

  if (!Array.isArray(request.items) || request.items.length === 0) {
    errors.push("At least one ingestion review queue item is required.")
  }

  for (const [index, item] of request.items?.entries() ?? []) {
    if (!item.title?.trim()) errors.push(`items[${index}].title is required.`)
    if (item.status !== "pending") {
      errors.push(`items[${index}].status must be "pending".`)
    }
    if (!item.reason) errors.push(`items[${index}].reason is required.`)
    if (!item.riskLevel) errors.push(`items[${index}].riskLevel is required.`)
    if (!item.targetType) errors.push(`items[${index}].targetType is required.`)
  }

  if ((request.items?.length ?? 0) > 10) {
    warnings.push(
      "This request contains more than 10 review items; keep controlled package creation small during Phase 4E."
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export async function createIngestionReviewPackage(
  request: IngestionReviewPackageRequest
): Promise<IngestionReviewPackageResult> {
  const validation = validateReviewPackageRequest(request)

  if (!validation.valid) {
    return {
      ok: false,
      writesToPrisma: false,
      graphWrites: false,
      graphDeletes: false,
      databaseAccess: false,
      model: "ExecutionAuthorizationRequest",
      createdPackageIds: [],
      createdPackages: [],
      errors: validation.errors,
      warnings: validation.warnings,
      summary: "Review package creation blocked by request validation.",
    }
  }

  const payloads = request.items!.map((item) =>
    buildExecutionAuthorizationPayload(item, request)
  )

  const createdPackages = []

  for (const payload of payloads) {
    const created = await prisma.executionAuthorizationRequest.create({
      data: {
        title: payload.title,
        targetType: payload.targetType,
        targetId: payload.targetId,
        requestedBy: payload.requestedBy,
        requestedRole: payload.requestedRole,
        actionType: payload.actionType,
        targetLayer: payload.targetLayer,
        riskLevel: payload.riskLevel,
        status: "pending",
        rationale: payload.rationale,
        policyMatches: toInputJson(payload.policyMatches),
        payload: toInputJson(payload.payload),
      },
    })

    createdPackages.push({
      id: created.id,
      title: created.title,
      status: created.status,
      targetType: created.targetType,
      targetId: created.targetId,
      actionType: created.actionType,
      riskLevel: created.riskLevel,
    })
  }

  const result: IngestionReviewPackageResult = {
    ok: true,
    writesToPrisma: true,
    graphWrites: false,
    graphDeletes: false,
    databaseAccess: true,
    model: "ExecutionAuthorizationRequest",
    createdPackageIds: createdPackages.map((item) => item.id),
    createdPackages,
    errors: [],
    warnings: validation.warnings,
    summary: "",
  }

  return {
    ...result,
    summary: summarizeReviewPackageResult(result),
  }
}

export function summarizeReviewPackageResult(
  result: Pick<
    IngestionReviewPackageResult,
    "ok" | "createdPackageIds" | "errors" | "graphWrites"
  >
): string {
  if (!result.ok) {
    return `Review package creation blocked with ${result.errors.length} error(s).`
  }

  return `${result.createdPackageIds.length} pending ExecutionAuthorizationRequest package(s) created. Graph writes: ${result.graphWrites}.`
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}
