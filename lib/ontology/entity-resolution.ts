import type {
  KnowledgeGraphEdgePayload,
  KnowledgeGraphNodePayload,
  SemanticGraphPayload,
} from "./semantic-graph-adapter"

export type EntityResolutionOutcome =
  | "CREATE_NEW"
  | "MATCH_EXISTING"
  | "POSSIBLE_DUPLICATE"
  | "BLOCK_CONFLICT"

export type ExistingEntityCandidate = {
  id: string
  name: string
  nodeType: string
  summary?: string | null
  sourceRecordId?: string | null
  metadata?: Record<string, unknown> | null
  status?: string | null
}

export type EntityFingerprint = {
  normalizedName: string
  nodeType: string
  semanticKey: string
  aliases: string[]
  summaryTokens: string[]
}

export type RelationshipFingerprint = {
  sourceKey: string
  targetKey: string
  relationType: string
  semanticKey: string
}

export type EntitySimilarityScore = {
  score: number
  nameScore: number
  typeScore: number
  aliasScore: number
  summaryScore: number
  reasons: string[]
}

export type EntityResolutionDecision = {
  outcome: EntityResolutionOutcome
  entity: KnowledgeGraphNodePayload
  existing?: ExistingEntityCandidate
  fingerprint: EntityFingerprint
  similarity?: EntitySimilarityScore
  warnings: string[]
  errors: string[]
}

export type RelationshipResolutionDecision = {
  outcome: "CREATE_NEW" | "MATCH_EXISTING" | "BLOCK_CONFLICT"
  edge: KnowledgeGraphEdgePayload
  fingerprint: RelationshipFingerprint
  sourceResolution: EntityResolutionOutcome | null
  targetResolution: EntityResolutionOutcome | null
  warnings: string[]
  errors: string[]
}

export type EntityResolutionPlan = {
  dryRun: true
  entitiesToCreate: EntityResolutionDecision[]
  entitiesToMatch: EntityResolutionDecision[]
  possibleDuplicates: EntityResolutionDecision[]
  blockedConflicts: EntityResolutionDecision[]
  relationshipsToCreate: RelationshipResolutionDecision[]
  duplicateRiskScore: number
  confidence: number
  warnings: string[]
  errors: string[]
}

export type EntityResolutionSummary = {
  dryRun: true
  valid: boolean
  entitiesToCreate: number
  entitiesToMatch: number
  possibleDuplicates: number
  blockedConflicts: number
  relationshipsToCreate: number
  duplicateRiskScore: number
  confidence: number
  warnings: string[]
  errors: string[]
  nextAction: string
}

const EXACT_MATCH_THRESHOLD = 0.92
const POSSIBLE_DUPLICATE_THRESHOLD = 0.68
const CONFLICT_THRESHOLD = 0.78

export function normalizeEntityName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function buildEntityFingerprint(
  entity: KnowledgeGraphNodePayload | ExistingEntityCandidate
): EntityFingerprint {
  const normalizedName = normalizeEntityName(entity.name)
  const nodeType = entity.nodeType.trim().toLowerCase()
  const metadata = safeMetadata(entity.metadata)
  const aliases = Array.isArray(metadata.aliases)
    ? metadata.aliases
        .filter((alias): alias is string => typeof alias === "string")
        .map(normalizeEntityName)
        .filter(Boolean)
    : []

  return {
    normalizedName,
    nodeType,
    semanticKey: `${nodeType}:${normalizedName}`,
    aliases: [...new Set(aliases)],
    summaryTokens: tokenizeSummary(entity.summary),
  }
}

export function buildRelationshipFingerprint(
  edge: KnowledgeGraphEdgePayload
): RelationshipFingerprint {
  const sourceKey = normalizeNodeReference(edge.sourceNodeId)
  const targetKey = normalizeNodeReference(edge.targetNodeId)
  const relationType = edge.relationType.trim().toLowerCase()

  return {
    sourceKey,
    targetKey,
    relationType,
    semanticKey: `${sourceKey}->${relationType}->${targetKey}`,
  }
}

export function scoreEntitySimilarity(
  a: KnowledgeGraphNodePayload | ExistingEntityCandidate,
  b: KnowledgeGraphNodePayload | ExistingEntityCandidate
): EntitySimilarityScore {
  const left = buildEntityFingerprint(a)
  const right = buildEntityFingerprint(b)
  const reasons: string[] = []
  const nameScore = scoreName(left, right)
  const typeScore = left.nodeType === right.nodeType ? 1 : 0
  const aliasScore = scoreAliases(left, right)
  const summaryScore = jaccard(left.summaryTokens, right.summaryTokens)
  const score = clamp(
    nameScore * 0.5 + typeScore * 0.25 + aliasScore * 0.15 + summaryScore * 0.1,
    0,
    1
  )

  if (nameScore >= 0.95) reasons.push("names normalize to an exact or near-exact match")
  if (typeScore === 1) reasons.push("entity types match")
  if (aliasScore > 0) reasons.push("aliases overlap")
  if (summaryScore >= 0.35) reasons.push("summaries share meaningful tokens")
  if (typeScore === 0) reasons.push("entity types differ")

  return {
    score: round(score),
    nameScore: round(nameScore),
    typeScore,
    aliasScore: round(aliasScore),
    summaryScore: round(summaryScore),
    reasons,
  }
}

export function classifyEntityResolution(
  candidate: KnowledgeGraphNodePayload,
  existing: ExistingEntityCandidate
): EntityResolutionDecision {
  const fingerprint = buildEntityFingerprint(candidate)
  const existingFingerprint = buildEntityFingerprint(existing)
  const similarity = scoreEntitySimilarity(candidate, existing)
  const warnings: string[] = []
  const errors: string[] = []

  if (
    similarity.score >= CONFLICT_THRESHOLD &&
    fingerprint.nodeType !== existingFingerprint.nodeType
  ) {
    errors.push(
      `Entity "${candidate.name}" closely resembles existing "${existing.name}" but has conflicting type "${candidate.nodeType}" vs "${existing.nodeType}".`
    )

    return {
      outcome: "BLOCK_CONFLICT",
      entity: candidate,
      existing,
      fingerprint,
      similarity,
      warnings,
      errors,
    }
  }

  if (
    fingerprint.semanticKey === existingFingerprint.semanticKey ||
    similarity.score >= EXACT_MATCH_THRESHOLD
  ) {
    return {
      outcome: "MATCH_EXISTING",
      entity: candidate,
      existing,
      fingerprint,
      similarity,
      warnings,
      errors,
    }
  }

  if (similarity.score >= POSSIBLE_DUPLICATE_THRESHOLD) {
    warnings.push(
      `Entity "${candidate.name}" may duplicate existing "${existing.name}".`
    )

    return {
      outcome: "POSSIBLE_DUPLICATE",
      entity: candidate,
      existing,
      fingerprint,
      similarity,
      warnings,
      errors,
    }
  }

  return {
    outcome: "CREATE_NEW",
    entity: candidate,
    fingerprint,
    similarity,
    warnings,
    errors,
  }
}

export function buildEntityResolutionPlan(
  payload: SemanticGraphPayload,
  existingCandidates: ExistingEntityCandidate[] = []
): EntityResolutionPlan {
  const entityDecisions = payload.nodes.map((node) =>
    resolveEntity(node, existingCandidates)
  )
  const relationshipDecisions = payload.edges.map((edge) =>
    resolveRelationship(edge, entityDecisions)
  )
  const warnings = [
    ...entityDecisions.flatMap((decision) => decision.warnings),
    ...relationshipDecisions.flatMap((decision) => decision.warnings),
  ]
  const errors = [
    ...entityDecisions.flatMap((decision) => decision.errors),
    ...relationshipDecisions.flatMap((decision) => decision.errors),
  ]
  const possibleDuplicates = entityDecisions.filter(
    (decision) => decision.outcome === "POSSIBLE_DUPLICATE"
  )
  const blockedConflicts = entityDecisions.filter(
    (decision) => decision.outcome === "BLOCK_CONFLICT"
  )
  const duplicateRiskScore = calculateDuplicateRiskScore(
    entityDecisions,
    payload.nodes.length
  )

  return {
    dryRun: true,
    entitiesToCreate: entityDecisions.filter(
      (decision) => decision.outcome === "CREATE_NEW"
    ),
    entitiesToMatch: entityDecisions.filter(
      (decision) => decision.outcome === "MATCH_EXISTING"
    ),
    possibleDuplicates,
    blockedConflicts,
    relationshipsToCreate: relationshipDecisions.filter(
      (decision) => decision.outcome === "CREATE_NEW"
    ),
    duplicateRiskScore,
    confidence: calculatePlanConfidence({
      duplicateRiskScore,
      warnings: warnings.length,
      errors: errors.length,
      entities: payload.nodes.length,
    }),
    warnings,
    errors,
  }
}

export function summarizeEntityResolutionPlan(
  plan: EntityResolutionPlan
): EntityResolutionSummary {
  const valid = plan.errors.length === 0

  return {
    dryRun: true,
    valid,
    entitiesToCreate: plan.entitiesToCreate.length,
    entitiesToMatch: plan.entitiesToMatch.length,
    possibleDuplicates: plan.possibleDuplicates.length,
    blockedConflicts: plan.blockedConflicts.length,
    relationshipsToCreate: plan.relationshipsToCreate.length,
    duplicateRiskScore: plan.duplicateRiskScore,
    confidence: plan.confidence,
    warnings: plan.warnings,
    errors: plan.errors,
    nextAction: !valid
      ? "Resolve blocked conflicts before a write can be considered."
      : plan.possibleDuplicates.length > 0
        ? "Send possible duplicates to review before enabling write execution."
        : "Entity resolution is clear for dry-run planning; no write is performed in Phase 4D.",
  }
}

function resolveEntity(
  candidate: KnowledgeGraphNodePayload,
  existingCandidates: ExistingEntityCandidate[]
): EntityResolutionDecision {
  const fingerprint = buildEntityFingerprint(candidate)

  if (!candidate.name.trim()) {
    return {
      outcome: "BLOCK_CONFLICT",
      entity: candidate,
      fingerprint,
      warnings: [],
      errors: ["Entity name is required."],
    }
  }

  if (!candidate.nodeType.trim()) {
    return {
      outcome: "BLOCK_CONFLICT",
      entity: candidate,
      fingerprint,
      warnings: [],
      errors: [`Entity type is required for "${candidate.name}".`],
    }
  }

  const decisions = existingCandidates
    .map((existing) => classifyEntityResolution(candidate, existing))
    .sort((a, b) => (b.similarity?.score ?? 0) - (a.similarity?.score ?? 0))

  const blocking = decisions.find((decision) => decision.outcome === "BLOCK_CONFLICT")
  if (blocking) return blocking

  const match = decisions.find((decision) => decision.outcome === "MATCH_EXISTING")
  if (match) return match

  const possibleDuplicate = decisions.find(
    (decision) => decision.outcome === "POSSIBLE_DUPLICATE"
  )
  if (possibleDuplicate) return possibleDuplicate

  return {
    outcome: "CREATE_NEW",
    entity: candidate,
    fingerprint,
    warnings: [],
    errors: [],
  }
}

function resolveRelationship(
  edge: KnowledgeGraphEdgePayload,
  entityDecisions: EntityResolutionDecision[]
): RelationshipResolutionDecision {
  const fingerprint = buildRelationshipFingerprint(edge)
  const warnings: string[] = []
  const errors: string[] = []
  const sourceResolution = resolutionForEdgeNode(edge.sourceNodeId, entityDecisions)
  const targetResolution = resolutionForEdgeNode(edge.targetNodeId, entityDecisions)

  if (!edge.relationType.trim()) {
    errors.push("Relationship type is required.")
  }

  if (!sourceResolution) {
    errors.push(`Relationship source is unresolved: ${edge.sourceNodeId}`)
  }

  if (!targetResolution) {
    errors.push(`Relationship target is unresolved: ${edge.targetNodeId}`)
  }

  if (
    sourceResolution === "BLOCK_CONFLICT" ||
    targetResolution === "BLOCK_CONFLICT"
  ) {
    errors.push("Relationship touches a blocked entity conflict.")
  }

  if (
    sourceResolution === "POSSIBLE_DUPLICATE" ||
    targetResolution === "POSSIBLE_DUPLICATE"
  ) {
    warnings.push("Relationship touches an entity that requires duplicate review.")
  }

  return {
    outcome: errors.length > 0 ? "BLOCK_CONFLICT" : "CREATE_NEW",
    edge,
    fingerprint,
    sourceResolution,
    targetResolution,
    warnings,
    errors,
  }
}

function resolutionForEdgeNode(
  nodeReference: string,
  decisions: EntityResolutionDecision[]
): EntityResolutionOutcome | null {
  const normalizedReference = normalizeNodeReference(nodeReference)
  const decision = decisions.find((item) => {
    const fingerprint = item.fingerprint
    return (
      normalizeNodeReference(fingerprint.semanticKey) === normalizedReference ||
      normalizeNodeReference(`ontology-node:${fingerprint.normalizedName}`) ===
        normalizedReference ||
      normalizeNodeReference(item.entity.name) === normalizedReference
    )
  })

  return decision?.outcome ?? null
}

function scoreName(a: EntityFingerprint, b: EntityFingerprint) {
  if (a.normalizedName === b.normalizedName) return 1
  if (a.aliases.includes(b.normalizedName) || b.aliases.includes(a.normalizedName)) {
    return 0.95
  }

  const leftTokens = a.normalizedName.split(" ").filter(Boolean)
  const rightTokens = b.normalizedName.split(" ").filter(Boolean)
  const tokenScore = jaccard(leftTokens, rightTokens)

  if (
    a.normalizedName.includes(b.normalizedName) ||
    b.normalizedName.includes(a.normalizedName)
  ) {
    return Math.max(0.75, tokenScore)
  }

  return tokenScore
}

function scoreAliases(a: EntityFingerprint, b: EntityFingerprint) {
  const left = [a.normalizedName, ...a.aliases]
  const right = [b.normalizedName, ...b.aliases]

  return jaccard(left, right)
}

function jaccard(a: string[], b: string[]) {
  const left = new Set(a.filter(Boolean))
  const right = new Set(b.filter(Boolean))

  if (left.size === 0 || right.size === 0) return 0

  const intersection = [...left].filter((item) => right.has(item)).length
  const union = new Set([...left, ...right]).size

  return intersection / union
}

function tokenizeSummary(summary?: string | null) {
  if (!summary) return []

  return normalizeEntityName(summary)
    .split(" ")
    .filter((token) => token.length > 2)
}

function normalizeNodeReference(reference: string) {
  return reference
    .trim()
    .toLowerCase()
    .replace(/^ontology-node:/, "")
    .replace(/^[a-z]+:/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function safeMetadata(metadata: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>
  }

  return {}
}

function calculateDuplicateRiskScore(
  decisions: EntityResolutionDecision[],
  entityCount: number
) {
  if (entityCount === 0) return 0

  const riskUnits = decisions.reduce((sum, decision) => {
    if (decision.outcome === "BLOCK_CONFLICT") return sum + 2
    if (decision.outcome === "POSSIBLE_DUPLICATE") return sum + 1
    if (decision.outcome === "MATCH_EXISTING") return sum + 0.3

    return sum
  }, 0)

  return Math.min(100, Math.round((riskUnits / entityCount) * 50))
}

function calculatePlanConfidence(input: {
  duplicateRiskScore: number
  warnings: number
  errors: number
  entities: number
}) {
  const warningPenalty = input.entities > 0 ? input.warnings / input.entities : 0
  const errorPenalty = input.entities > 0 ? input.errors / input.entities : 0
  const confidence =
    1 - input.duplicateRiskScore / 100 - warningPenalty * 0.08 - errorPenalty * 0.25

  return round(clamp(confidence, 0, 1))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function round(value: number) {
  return Math.round(value * 100) / 100
}
