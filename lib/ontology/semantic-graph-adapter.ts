import {
  mapOntologyToSemanticGraphShape,
  type OntologyExtractionResult,
  type OntologyRelationshipType,
} from "./index"

export type SemanticKnowledgeRecordPayload = {
  organizationId?: string | null
  workspaceId?: string | null
  title: string
  content: string
  recordType: string
  sourceLayer: string
  sourceType?: string | null
  sourceId?: string | null
  importance: number
  confidence: number
  tags: unknown[]
  metadata: Record<string, unknown>
  status: "active"
}

export type KnowledgeGraphNodePayload = {
  organizationId?: string | null
  workspaceId?: string | null
  nodeType: string
  name: string
  summary?: string | null
  importance: number
  sourceRecordId?: string | null
  metadata: Record<string, unknown>
  status: "active"
}

export type KnowledgeGraphEdgePayload = {
  organizationId?: string | null
  workspaceId?: string | null
  sourceNodeId: string
  targetNodeId: string
  relationType: OntologyRelationshipType
  strength: number
  summary?: string | null
  evidence: Record<string, unknown>
  status: "active"
}

export type SemanticGraphPayload = {
  record: SemanticKnowledgeRecordPayload
  nodes: KnowledgeGraphNodePayload[]
  edges: KnowledgeGraphEdgePayload[]
  references: {
    sourceRecordTitle: string
    nodeKeys: Record<string, string>
    edgeNodeReferences: Array<{
      sourceName: string
      targetName: string
      sourceNodeKey: string
      targetNodeKey: string
    }>
  }
}

export type SemanticGraphPayloadValidation = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

type AdapterOptions = {
  organizationId?: string | null
  workspaceId?: string | null
}

export function buildSemanticGraphPayload(
  result: OntologyExtractionResult,
  options: AdapterOptions = {}
): SemanticGraphPayload {
  const record = buildSemanticRecordPayload(result, options)
  const nodes = buildKnowledgeGraphNodePayloads(result, options)
  const nodeKeys = Object.fromEntries(
    nodes.map((node) => [node.name, semanticNodeKey(node.name)])
  )

  return {
    record,
    nodes,
    edges: buildKnowledgeGraphEdgePayloads(result, options),
    references: {
      sourceRecordTitle: record.title,
      nodeKeys,
      edgeNodeReferences: result.relationships.map((relationship) => ({
        sourceName: relationship.sourceEntityName,
        targetName: relationship.targetEntityName,
        sourceNodeKey: semanticNodeKey(relationship.sourceEntityName),
        targetNodeKey: semanticNodeKey(relationship.targetEntityName),
      })),
    },
  }
}

export function buildSemanticRecordPayload(
  result: OntologyExtractionResult,
  options: AdapterOptions = {}
): SemanticKnowledgeRecordPayload {
  const graphShape = mapOntologyToSemanticGraphShape(result)
  const [record] = graphShape.records

  return {
    organizationId: options.organizationId ?? null,
    workspaceId: options.workspaceId ?? null,
    title: record.title,
    content: record.content,
    recordType: record.recordType,
    sourceLayer: record.sourceLayer,
    sourceType: record.sourceType,
    sourceId: record.sourceId,
    importance: record.importance,
    confidence: record.confidence,
    tags: record.tags,
    metadata: record.metadata,
    status: "active",
  }
}

export function buildKnowledgeGraphNodePayloads(
  result: OntologyExtractionResult,
  options: AdapterOptions = {}
): KnowledgeGraphNodePayload[] {
  const graphShape = mapOntologyToSemanticGraphShape(result)

  return graphShape.nodes.map((node) => ({
    organizationId: options.organizationId ?? null,
    workspaceId: options.workspaceId ?? null,
    nodeType: node.nodeType,
    name: node.name,
    summary: node.summary,
    importance: node.importance,
    sourceRecordId: null,
    metadata: {
      ...node.metadata,
      sourceRecordTitle: node.sourceRecordTitle,
      semanticNodeKey: semanticNodeKey(node.name),
    },
    status: "active",
  }))
}

export function buildKnowledgeGraphEdgePayloads(
  result: OntologyExtractionResult,
  options: AdapterOptions = {}
): KnowledgeGraphEdgePayload[] {
  const graphShape = mapOntologyToSemanticGraphShape(result)

  return graphShape.edges.map((edge) => ({
    organizationId: options.organizationId ?? null,
    workspaceId: options.workspaceId ?? null,
    sourceNodeId: semanticNodeKey(edge.sourceName),
    targetNodeId: semanticNodeKey(edge.targetName),
    relationType: edge.relationType,
    strength: edge.strength,
    summary: edge.summary,
    evidence: {
      ...edge.evidence,
      adapterNote:
        "sourceNodeId and targetNodeId are deterministic node keys until a persistence layer resolves real database ids.",
      sourceName: edge.sourceName,
      targetName: edge.targetName,
    },
    status: "active",
  }))
}

export function validateSemanticGraphPayload(
  payload: SemanticGraphPayload
): SemanticGraphPayloadValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (!payload.record.title.trim()) errors.push("record.title is required")
  if (!payload.record.content.trim()) errors.push("record.content is required")
  if (!payload.record.recordType.trim()) errors.push("record.recordType is required")
  if (payload.nodes.length === 0) warnings.push("payload contains no nodes")

  const nodeKeys = new Set(payload.nodes.map((node) => semanticNodeKey(node.name)))

  for (const node of payload.nodes) {
    if (!node.name.trim()) errors.push("node.name is required")
    if (!node.nodeType.trim()) errors.push(`nodeType is required for ${node.name}`)
  }

  for (const edge of payload.edges) {
    if (!edge.relationType) errors.push("edge.relationType is required")
    if (!nodeKeys.has(edge.sourceNodeId)) {
      errors.push(`edge sourceNodeId is unresolved: ${edge.sourceNodeId}`)
    }
    if (!nodeKeys.has(edge.targetNodeId)) {
      errors.push(`edge targetNodeId is unresolved: ${edge.targetNodeId}`)
    }
    if (edge.strength < 0 || edge.strength > 1) {
      errors.push(`edge strength must be between 0 and 1: ${edge.strength}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

function semanticNodeKey(name: string) {
  return `ontology-node:${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`
}
