import {
  validateSemanticGraphPayload,
  type KnowledgeGraphEdgePayload,
  type KnowledgeGraphNodePayload,
  type SemanticGraphPayload,
  type SemanticKnowledgeRecordPayload,
} from "./semantic-graph-adapter"

export type ResolvedTemporaryNodeKeys = {
  nodeKeyMap: Record<string, string>
  edges: KnowledgeGraphEdgePayload[]
  warnings: string[]
  errors: string[]
}

export type SemanticGraphIngestionPlan = {
  dryRun: true
  recordsToCreate: SemanticKnowledgeRecordPayload[]
  nodesToCreate: KnowledgeGraphNodePayload[]
  edgesToCreate: KnowledgeGraphEdgePayload[]
  nodeKeyMap: Record<string, string>
  warnings: string[]
  errors: string[]
}

export type SemanticGraphIngestionValidation = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export type SemanticGraphIngestionSummary = {
  dryRun: true
  valid: boolean
  records: number
  nodes: number
  edges: number
  warnings: string[]
  errors: string[]
  nextAction: string
}

export function createSemanticGraphIngestionPlan(
  payload: SemanticGraphPayload
): SemanticGraphIngestionPlan {
  const adapterValidation = validateSemanticGraphPayload(payload)
  const resolved = resolveTemporaryNodeKeys(payload)

  return {
    dryRun: true,
    recordsToCreate: [payload.record],
    nodesToCreate: payload.nodes.map((node) => ({
      ...node,
      metadata: {
        ...node.metadata,
        dryRunResolvedNodeId:
          resolved.nodeKeyMap[nodeKeyForNodePayload(node)] ?? null,
      },
    })),
    edgesToCreate: resolved.edges,
    nodeKeyMap: resolved.nodeKeyMap,
    warnings: [...adapterValidation.warnings, ...resolved.warnings],
    errors: [...adapterValidation.errors, ...resolved.errors],
  }
}

export function resolveTemporaryNodeKeys(
  payload: SemanticGraphPayload
): ResolvedTemporaryNodeKeys {
  const warnings: string[] = []
  const errors: string[] = []
  const nodeKeyMap: Record<string, string> = {}

  for (const [index, node] of payload.nodes.entries()) {
    const nodeKey = nodeKeyForNodePayload(node)

    if (!nodeKey) {
      errors.push(`Node ${node.name || index} is missing a semantic node key`)
      continue
    }

    if (nodeKeyMap[nodeKey]) {
      warnings.push(`Duplicate node key will resolve to the first planned node: ${nodeKey}`)
      continue
    }

    nodeKeyMap[nodeKey] = `dry-run-node-${index + 1}`
  }

  const edges = payload.edges.map((edge, index) => {
    const sourceNodeId = nodeKeyMap[edge.sourceNodeId]
    const targetNodeId = nodeKeyMap[edge.targetNodeId]

    if (!sourceNodeId) {
      errors.push(`Edge ${index + 1} has unresolved source node key: ${edge.sourceNodeId}`)
    }

    if (!targetNodeId) {
      errors.push(`Edge ${index + 1} has unresolved target node key: ${edge.targetNodeId}`)
    }

    return {
      ...edge,
      sourceNodeId: sourceNodeId ?? edge.sourceNodeId,
      targetNodeId: targetNodeId ?? edge.targetNodeId,
      evidence: {
        ...edge.evidence,
        dryRunResolved: Boolean(sourceNodeId && targetNodeId),
        originalSourceNodeKey: edge.sourceNodeId,
        originalTargetNodeKey: edge.targetNodeId,
      },
    }
  })

  if (payload.edges.length === 0) {
    warnings.push("No edges are planned for creation")
  }

  return {
    nodeKeyMap,
    edges,
    warnings,
    errors,
  }
}

export function validateIngestionPlan(
  plan: SemanticGraphIngestionPlan
): SemanticGraphIngestionValidation {
  const errors = [...plan.errors]
  const warnings = [...plan.warnings]
  const resolvedNodeIds = new Set(Object.values(plan.nodeKeyMap))

  if (!plan.dryRun) {
    errors.push("Ingestion plan must remain dryRun: true")
  }

  if (plan.recordsToCreate.length !== 1) {
    errors.push("Exactly one semantic knowledge record should be planned")
  }

  if (plan.nodesToCreate.length === 0) {
    warnings.push("No knowledge graph nodes are planned")
  }

  for (const record of plan.recordsToCreate) {
    if (!record.title.trim()) errors.push("Planned record title is required")
    if (!record.content.trim()) errors.push("Planned record content is required")
  }

  for (const node of plan.nodesToCreate) {
    if (!node.name.trim()) errors.push("Planned node name is required")
    if (!node.nodeType.trim()) errors.push(`Planned node type is required for ${node.name}`)
  }

  for (const edge of plan.edgesToCreate) {
    if (!resolvedNodeIds.has(edge.sourceNodeId)) {
      errors.push(`Planned edge source id is not resolved: ${edge.sourceNodeId}`)
    }
    if (!resolvedNodeIds.has(edge.targetNodeId)) {
      errors.push(`Planned edge target id is not resolved: ${edge.targetNodeId}`)
    }
    if (edge.strength < 0 || edge.strength > 1) {
      errors.push(`Planned edge strength is outside 0..1: ${edge.strength}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export function summarizeIngestionPlan(
  plan: SemanticGraphIngestionPlan
): SemanticGraphIngestionSummary {
  const validation = validateIngestionPlan(plan)

  return {
    dryRun: true,
    valid: validation.valid,
    records: plan.recordsToCreate.length,
    nodes: plan.nodesToCreate.length,
    edges: plan.edgesToCreate.length,
    warnings: validation.warnings,
    errors: validation.errors,
    nextAction: validation.valid
      ? "Review the dry-run plan before enabling a guarded Prisma transaction in Phase 4C."
      : "Resolve validation errors before any write path is considered.",
  }
}

function nodeKeyForNodePayload(node: KnowledgeGraphNodePayload) {
  const key = node.metadata.semanticNodeKey

  if (typeof key === "string" && key.trim()) return key

  return `ontology-node:${node.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`
}
