import crypto from "crypto"

import { prisma } from "../prisma"
import type { GovernedIngestionPlan } from "./governed-ingestion"
import type { GovernedIngestionDecision } from "../governance/ingestion-governance"

export type SemanticGraphTransactionMode =
  | "dry-run-preview"
  | "blocked"
  | "executed"

export type SemanticGraphTransactionRequest = {
  plan: GovernedIngestionPlan
  dryRun?: boolean
  explicitWriteEnabled?: boolean
  actorId?: string | null
  organizationId?: string | null
  workspaceId?: string | null
  reason?: string
}

export type SemanticGraphTransactionPreview = {
  recordsToCreate: GovernedIngestionPlan["executionPlan"]["recordsToCreate"]
  nodesToCreate: GovernedIngestionPlan["executionPlan"]["nodesToCreate"]
  edgesToCreate: GovernedIngestionPlan["executionPlan"]["edgesToCreate"]
  nodeKeyMap: GovernedIngestionNodeKeyMap
  governedDecision: GovernedIngestionDecision
  approvalRequired: boolean
  writesToPrisma: false
  databaseAccess: false
}

type GovernedIngestionNodeKeyMap =
  GovernedIngestionPlan["executionPlan"]["nodeKeyMap"]

export type SemanticGraphTransactionValidation = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export type SemanticGraphTransactionCreatedIds = {
  recordId: string
  embeddingIndexId: string | null
  nodeIds: string[]
  edgeIds: string[]
  auditTrailId: string | null
  nodeKeyMap: Record<string, string>
}

export type SemanticGraphTransactionResult = {
  ok: boolean
  mode: SemanticGraphTransactionMode
  dryRun: boolean
  blocked: boolean
  executed: boolean
  writesToPrisma: boolean
  databaseAccess: boolean
  errors: string[]
  warnings: string[]
  preview: SemanticGraphTransactionPreview
  createdIds?: SemanticGraphTransactionCreatedIds
  summary: string
}

type TenantScopeValidation = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

type DuplicatePreflightResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export async function executeSemanticGraphTransaction(
  request: SemanticGraphTransactionRequest
): Promise<SemanticGraphTransactionResult> {
  const dryRun = request.dryRun !== false
  const preview = buildTransactionPreview(request)
  const validation = validateTransactionRequest({ ...request, dryRun })

  if (dryRun) {
    return {
      ok: validation.errors.length === 0,
      mode: "dry-run-preview",
      dryRun: true,
      blocked: false,
      executed: false,
      writesToPrisma: false,
      databaseAccess: false,
      errors: validation.errors,
      warnings: validation.warnings,
      preview,
      summary:
        "Dry-run transaction preview only. No Prisma writes were attempted.",
    }
  }

  if (!validation.valid) {
    return blockedResult({
      dryRun,
      preview,
      errors: validation.errors,
      warnings: validation.warnings,
      databaseAccess: false,
      summary: "Write request blocked by transaction preconditions.",
    })
  }

  const tenantScope = await validateTenantScope(request)

  if (!tenantScope.valid) {
    return blockedResult({
      dryRun,
      preview,
      errors: tenantScope.errors,
      warnings: [...validation.warnings, ...tenantScope.warnings],
      databaseAccess: true,
      summary: "Write request blocked by tenant/workspace validation.",
    })
  }

  const duplicatePreflight = await runDuplicatePreflight(request)

  if (!duplicatePreflight.valid) {
    return blockedResult({
      dryRun,
      preview,
      errors: duplicatePreflight.errors,
      warnings: [
        ...validation.warnings,
        ...tenantScope.warnings,
        ...duplicatePreflight.warnings,
      ],
      databaseAccess: true,
      summary: "Write request blocked by duplicate preflight errors.",
    })
  }

  try {
    const createdIds = await writeSemanticGraphTransaction(request)

    return {
      ok: true,
      mode: "executed",
      dryRun: false,
      blocked: false,
      executed: true,
      writesToPrisma: true,
      databaseAccess: true,
      errors: [],
      warnings: [
        ...validation.warnings,
        ...tenantScope.warnings,
        ...duplicatePreflight.warnings,
      ],
      preview,
      createdIds,
      summary: "Guarded semantic graph transaction executed successfully.",
    }
  } catch (error) {
    return blockedResult({
      dryRun,
      preview,
      errors: [
        error instanceof Error
          ? error.message
          : "Semantic graph transaction failed.",
      ],
      warnings: [
        ...validation.warnings,
        ...tenantScope.warnings,
        ...duplicatePreflight.warnings,
      ],
      databaseAccess: true,
      summary: "Write request failed and was rolled back by the transaction.",
    })
  }
}

export function validateTransactionRequest(
  request: SemanticGraphTransactionRequest
): SemanticGraphTransactionValidation {
  const dryRun = request.dryRun !== false
  const errors: string[] = []
  const warnings: string[] = []

  if (!request.plan) {
    errors.push("Governed ingestion plan is required.")
    return { valid: false, errors, warnings }
  }

  if (request.plan.errors.length > 0) {
    errors.push("Governed ingestion plan contains errors.")
  }

  if (!request.plan.validation.valid) {
    errors.push("Governed ingestion plan validation must pass.")
  }

  if (request.plan.decision === "BLOCK") {
    errors.push("Governance decision BLOCK cannot be executed.")
  }

  if (request.plan.executionPlan.recordsToCreate.length !== 1) {
    errors.push("Exactly one SemanticKnowledgeRecord is required for this slice.")
  }

  if (dryRun) {
    if (request.explicitWriteEnabled) {
      warnings.push("explicitWriteEnabled is ignored while dryRun is true.")
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  if (request.explicitWriteEnabled !== true) {
    errors.push("explicitWriteEnabled must be true when dryRun is false.")
  }

  if (
    request.plan.decision !== "ALLOW" &&
    request.plan.decision !== "ALLOW_WITH_WARNING"
  ) {
    errors.push("Governance decision must be ALLOW or ALLOW_WITH_WARNING for write mode.")
  }

  if (request.plan.approvalRequired) {
    errors.push("approvalRequired must be false for this transaction slice.")
  }

  if (!request.actorId?.trim()) {
    errors.push("actorId is required when dryRun is false.")
  }

  if (!request.organizationId?.trim()) {
    errors.push("organizationId is required when dryRun is false.")
  }

  if (!request.workspaceId?.trim()) {
    errors.push("workspaceId is required when dryRun is false.")
  }

  if (request.plan.executionPlan.databaseAccess !== false) {
    errors.push("Input execution plan must not request database access.")
  }

  if (request.plan.executionPlan.writesToPrisma !== false) {
    errors.push("Input execution plan must not request Prisma writes.")
  }

  for (const node of request.plan.executionPlan.nodesToCreate) {
    if (!node.name.trim()) errors.push("Every planned node must have a name.")
    if (!node.nodeType.trim()) errors.push(`Node type is required for ${node.name}.`)
  }

  for (const edge of request.plan.executionPlan.edgesToCreate) {
    if (!edge.sourceNodeId.trim()) errors.push("Every planned edge needs a source node id.")
    if (!edge.targetNodeId.trim()) errors.push("Every planned edge needs a target node id.")
    if (!edge.relationType.trim()) errors.push("Every planned edge needs a relation type.")
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export function buildTransactionPreview(
  request: SemanticGraphTransactionRequest
): SemanticGraphTransactionPreview {
  return {
    recordsToCreate: request.plan.executionPlan.recordsToCreate,
    nodesToCreate: request.plan.executionPlan.nodesToCreate,
    edgesToCreate: request.plan.executionPlan.edgesToCreate,
    nodeKeyMap: request.plan.executionPlan.nodeKeyMap,
    governedDecision: request.plan.decision,
    approvalRequired: request.plan.approvalRequired,
    writesToPrisma: false,
    databaseAccess: false,
  }
}

export function summarizeTransactionResult(
  result: SemanticGraphTransactionResult
) {
  return {
    ok: result.ok,
    mode: result.mode,
    dryRun: result.dryRun,
    blocked: result.blocked,
    executed: result.executed,
    writesToPrisma: result.writesToPrisma,
    databaseAccess: result.databaseAccess,
    records: result.preview.recordsToCreate.length,
    nodes: result.preview.nodesToCreate.length,
    edges: result.preview.edgesToCreate.length,
    createdIds: result.createdIds,
    errors: result.errors,
    warnings: result.warnings,
    summary: result.summary,
  }
}

async function validateTenantScope(
  request: SemanticGraphTransactionRequest
): Promise<TenantScopeValidation> {
  const errors: string[] = []
  const warnings: string[] = []
  const organizationId = request.organizationId?.trim()
  const workspaceId = request.workspaceId?.trim()

  if (!organizationId || !workspaceId) {
    return {
      valid: false,
      errors: ["organizationId and workspaceId are required for tenant validation."],
      warnings,
    }
  }

  const [organization, workspace] = await Promise.all([
    prisma.sovereignOrganization.findUnique({
      where: { id: organizationId },
    }),
    prisma.organizationWorkspace.findFirst({
      where: {
        id: workspaceId,
        organizationId,
      },
    }),
  ])

  if (!organization) {
    errors.push("organizationId does not match an existing SovereignOrganization.")
  }

  if (!workspace) {
    errors.push("workspaceId does not exist for the supplied organizationId.")
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

async function runDuplicatePreflight(
  request: SemanticGraphTransactionRequest
): Promise<DuplicatePreflightResult> {
  const errors: string[] = []
  const warnings: string[] = []
  const organizationId = request.organizationId?.trim()
  const workspaceId = request.workspaceId?.trim()
  const [record] = request.plan.executionPlan.recordsToCreate

  if (!organizationId || !workspaceId || !record) {
    return {
      valid: false,
      errors: ["Duplicate preflight requires organization, workspace, and record payload."],
      warnings,
    }
  }

  const recordCandidates = await prisma.semanticKnowledgeRecord.findMany({
    where: {
      organizationId,
      workspaceId,
      status: "active",
      OR: [
        record.sourceId ? { sourceId: record.sourceId } : undefined,
        { title: record.title },
      ].filter(Boolean) as Array<{ sourceId?: string; title?: string }>,
    },
    select: { id: true, title: true, sourceId: true },
    take: 5,
  })

  if (recordCandidates.length > 0) {
    warnings.push(
      `Duplicate preflight found ${recordCandidates.length} active record candidate(s).`
    )
  }

  const existingNodes = await prisma.knowledgeGraphNode.findMany({
    where: {
      organizationId,
      workspaceId,
      status: "active",
      OR: request.plan.executionPlan.nodesToCreate.map((node) => ({
        nodeType: node.nodeType,
        name: node.name,
      })),
    },
    select: { id: true, name: true, nodeType: true },
    take: Math.max(1, request.plan.executionPlan.nodesToCreate.length * 2),
  })

  if (existingNodes.length > 0) {
    warnings.push(
      `Duplicate preflight found ${existingNodes.length} active node candidate(s).`
    )
  }

  const nodeIdByName = new Map(
    existingNodes.map((node) => [node.name.trim().toLowerCase(), node.id])
  )

  const edgeChecks = request.plan.executionPlan.edgesToCreate
    .map((edge) => {
      const sourceName =
        typeof edge.evidence.sourceName === "string"
          ? edge.evidence.sourceName
          : null
      const targetName =
        typeof edge.evidence.targetName === "string"
          ? edge.evidence.targetName
          : null

      if (!sourceName || !targetName) return null

      const sourceNodeId = nodeIdByName.get(sourceName.trim().toLowerCase())
      const targetNodeId = nodeIdByName.get(targetName.trim().toLowerCase())

      if (!sourceNodeId || !targetNodeId) return null

      return prisma.knowledgeGraphEdge.findFirst({
        where: {
          organizationId,
          workspaceId,
          sourceNodeId,
          targetNodeId,
          relationType: edge.relationType,
          status: "active",
        },
        select: { id: true },
      })
    })
    .filter((check): check is NonNullable<typeof check> => Boolean(check))

  if (edgeChecks.length > 0) {
    const existingEdges = (await Promise.all(edgeChecks)).filter(Boolean)

    if (existingEdges.length > 0) {
      warnings.push(
        `Duplicate preflight found ${existingEdges.length} active edge candidate(s).`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

async function writeSemanticGraphTransaction(
  request: SemanticGraphTransactionRequest
): Promise<SemanticGraphTransactionCreatedIds> {
  const organizationId = requiredString(request.organizationId, "organizationId")
  const workspaceId = requiredString(request.workspaceId, "workspaceId")
  const actorId = requiredString(request.actorId, "actorId")
  const [recordPayload] = request.plan.executionPlan.recordsToCreate

  if (!recordPayload) {
    throw new Error("No SemanticKnowledgeRecord payload is available.")
  }

  return prisma.$transaction(async (tx) => {
    const record = await tx.semanticKnowledgeRecord.create({
      data: {
        organizationId,
        workspaceId,
        title: recordPayload.title,
        content: recordPayload.content,
        recordType: recordPayload.recordType,
        sourceLayer: recordPayload.sourceLayer,
        sourceType: recordPayload.sourceType ?? null,
        sourceId: recordPayload.sourceId ?? null,
        importance: recordPayload.importance,
        confidence: recordPayload.confidence,
        tags: recordPayload.tags as any,
        metadata: withGovernedMetadata(
          recordPayload.metadata,
          request,
          actorId
        ) as any,
        status: "active",
      },
    })

    const embeddingIndex = await tx.semanticEmbeddingIndex.create({
      data: {
        knowledgeId: record.id,
        organizationId,
        workspaceId,
        embeddingModel: "text-embedding-3-small",
        vectorHash: hashText(record.content),
        dimensions: 1536,
        contentPreview: record.content.slice(0, 280),
        metadata: {
          note: "Vector hash placeholder. Replace with real embeddings in a later embeddings phase.",
          source: "phase-4c-guarded-write-executor",
          requestId: request.plan.requestId,
        },
        status: "indexed",
      },
    })

    const nodeIds: string[] = []
    const nodeKeyMap: Record<string, string> = {}

    for (const nodePayload of request.plan.executionPlan.nodesToCreate) {
      const node = await tx.knowledgeGraphNode.create({
        data: {
          organizationId,
          workspaceId,
          nodeType: nodePayload.nodeType,
          name: nodePayload.name,
          summary: nodePayload.summary ?? null,
          importance: nodePayload.importance,
          sourceRecordId: record.id,
          metadata: withGovernedMetadata(
            nodePayload.metadata,
            request,
            actorId
          ) as any,
          status: "active",
        },
      })

      nodeIds.push(node.id)
      const temporaryNodeId = temporaryNodeIdForPayload(
        nodePayload,
        request.plan
      )

      if (temporaryNodeId) nodeKeyMap[temporaryNodeId] = node.id

      const semanticNodeKey = semanticNodeKeyForPayload(nodePayload)

      if (semanticNodeKey) nodeKeyMap[semanticNodeKey] = node.id
    }

    const edgeIds: string[] = []

    for (const edgePayload of request.plan.executionPlan.edgesToCreate) {
      const sourceNodeId = nodeKeyMap[edgePayload.sourceNodeId]
      const targetNodeId = nodeKeyMap[edgePayload.targetNodeId]

      if (!sourceNodeId || !targetNodeId) {
        throw new Error(
          `Unable to resolve edge nodes for relation ${edgePayload.relationType}.`
        )
      }

      const edge = await tx.knowledgeGraphEdge.create({
        data: {
          organizationId,
          workspaceId,
          sourceNodeId,
          targetNodeId,
          relationType: edgePayload.relationType,
          strength: edgePayload.strength,
          summary: edgePayload.summary ?? null,
          evidence: withGovernedMetadata(
            edgePayload.evidence,
            request,
            actorId
          ) as any,
          status: "active",
        },
      })

      edgeIds.push(edge.id)
    }

    const audit = await tx.governanceAuditTrail.create({
      data: {
        eventType: "semantic-graph-ingestion",
        actor: actorId,
        actorRole: null,
        targetType: "SemanticKnowledgeRecord",
        targetId: record.id,
        action: "semantic-graph.write",
        outcome: "completed",
        severity:
          request.plan.decision === "ALLOW_WITH_WARNING" ? "warning" : "info",
        details: {
          requestId: request.plan.requestId,
          decision: request.plan.decision,
          approvalRequired: request.plan.approvalRequired,
          riskScore: request.plan.riskScore,
          duplicateRisk: request.plan.duplicateRisk,
          ontologyConfidence: request.plan.ontologyConfidence,
          relationshipConfidence: request.plan.relationshipConfidence,
          recordsCreated: 1,
          nodesCreated: nodeIds.length,
          edgesCreated: edgeIds.length,
          embeddingIndexCreated: Boolean(embeddingIndex.id),
          reason: request.reason ?? null,
        },
      },
    })

    return {
      recordId: record.id,
      embeddingIndexId: embeddingIndex.id,
      nodeIds,
      edgeIds,
      auditTrailId: audit.id,
      nodeKeyMap,
    }
  })
}

function blockedResult(input: {
  dryRun: boolean
  preview: SemanticGraphTransactionPreview
  errors: string[]
  warnings: string[]
  databaseAccess: boolean
  summary: string
}): SemanticGraphTransactionResult {
  return {
    ok: false,
    mode: "blocked",
    dryRun: input.dryRun,
    blocked: true,
    executed: false,
    writesToPrisma: false,
    databaseAccess: input.databaseAccess,
    errors: input.errors,
    warnings: input.warnings,
    preview: input.preview,
    summary: input.summary,
  }
}

function withGovernedMetadata(
  metadata: Record<string, unknown>,
  request: SemanticGraphTransactionRequest,
  actorId: string
) {
  return {
    ...metadata,
    governedIngestion: {
      requestId: request.plan.requestId,
      decision: request.plan.decision,
      riskScore: request.plan.riskScore,
      duplicateRisk: request.plan.duplicateRisk,
      ontologyConfidence: request.plan.ontologyConfidence,
      relationshipConfidence: request.plan.relationshipConfidence,
      actorId,
    },
  }
}

function temporaryNodeIdForPayload(
  node: GovernedIngestionPlan["executionPlan"]["nodesToCreate"][number],
  plan: GovernedIngestionPlan
) {
  const dryRunResolvedNodeId = node.metadata.dryRunResolvedNodeId

  if (typeof dryRunResolvedNodeId === "string" && dryRunResolvedNodeId.trim()) {
    return dryRunResolvedNodeId
  }

  const semanticNodeKey = semanticNodeKeyForPayload(node)

  if (semanticNodeKey) return plan.executionPlan.nodeKeyMap[semanticNodeKey]

  return null
}

function semanticNodeKeyForPayload(
  node: GovernedIngestionPlan["executionPlan"]["nodesToCreate"][number]
) {
  const semanticNodeKey = node.metadata.semanticNodeKey

  if (typeof semanticNodeKey === "string" && semanticNodeKey.trim()) {
    return semanticNodeKey
  }

  return null
}

function requiredString(value: string | null | undefined, label: string) {
  const trimmed = value?.trim()

  if (!trimmed) throw new Error(`${label} is required.`)

  return trimmed
}

function hashText(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex")
}
