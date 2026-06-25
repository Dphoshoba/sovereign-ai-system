import {
  DOMAIN_CATEGORIES,
  type DomainCategory,
  type DomainOntologyTypes,
  type OntologyEntityType,
  type OntologyExtractionResult,
  type OntologyRelationshipType,
  type SemanticGraphMappingShape,
} from "./types"

export * from "./types"

const DOMAIN_ALIASES: Record<string, DomainCategory> = {
  ai: "ai-tools",
  "ai-automation": "ai-tools",
  "ai-tools": "ai-tools",
  bible: "bible-stories",
  "bible-story": "bible-stories",
  "bible-stories": "bible-stories",
  biblical: "bible-stories",
  business: "business",
  creators: "creators",
  creator: "creators",
  faith: "bible-stories",
  health: "health",
  history: "history",
  motivation: "motivation",
  space: "space",
}

const BASE_ENTITY_TYPES: OntologyEntityType[] = [
  "person",
  "place",
  "event",
  "process",
  "object",
  "theme",
  "application",
]

const UNIVERSAL_RELATIONSHIPS: OntologyRelationshipType[] = [
  "associated-with",
  "causes",
  "depends-on",
  "influences",
  "supports",
]

const DOMAIN_ONTOLOGY_TYPES: Record<DomainCategory, DomainOntologyTypes> = {
  "ai-tools": {
    category: "ai-tools",
    entityTypes: ["application", "process", "object", "theme", "person"],
    relationshipTypes: [
      ...UNIVERSAL_RELATIONSHIPS,
      "enables",
      "uses",
      "challenges",
    ],
    recordType: "ontology-ai-tools",
    sourceLayer: "ontology",
    tags: ["ontology", "ai-tools", "technology"],
  },
  "bible-stories": {
    category: "bible-stories",
    entityTypes: ["person", "place", "event", "object", "theme", "process"],
    relationshipTypes: [
      ...UNIVERSAL_RELATIONSHIPS,
      "confronts",
      "demonstrates",
      "reveals",
      "teaches",
    ],
    recordType: "ontology-bible-stories",
    sourceLayer: "ontology",
    tags: ["ontology", "bible-stories", "faith"],
  },
  history: {
    category: "history",
    entityTypes: ["person", "place", "event", "process", "object", "theme"],
    relationshipTypes: [
      ...UNIVERSAL_RELATIONSHIPS,
      "precedes",
      "develops-into",
      "located-in",
      "participates-in",
    ],
    recordType: "ontology-history",
    sourceLayer: "ontology",
    tags: ["ontology", "history"],
  },
  health: {
    category: "health",
    entityTypes: ["process", "object", "theme", "application", "person"],
    relationshipTypes: [
      ...UNIVERSAL_RELATIONSHIPS,
      "causes",
      "enables",
      "challenges",
    ],
    recordType: "ontology-health",
    sourceLayer: "ontology",
    tags: ["ontology", "health"],
  },
  space: {
    category: "space",
    entityTypes: ["place", "event", "object", "process", "theme", "application"],
    relationshipTypes: [
      ...UNIVERSAL_RELATIONSHIPS,
      "located-in",
      "reveals",
      "uses",
    ],
    recordType: "ontology-space",
    sourceLayer: "ontology",
    tags: ["ontology", "space"],
  },
  motivation: {
    category: "motivation",
    entityTypes: ["person", "process", "theme", "event", "application"],
    relationshipTypes: [
      ...UNIVERSAL_RELATIONSHIPS,
      "demonstrates",
      "teaches",
      "confronts",
    ],
    recordType: "ontology-motivation",
    sourceLayer: "ontology",
    tags: ["ontology", "motivation"],
  },
  business: {
    category: "business",
    entityTypes: ["person", "process", "object", "application", "theme", "event"],
    relationshipTypes: [
      ...UNIVERSAL_RELATIONSHIPS,
      "enables",
      "uses",
      "challenges",
    ],
    recordType: "ontology-business",
    sourceLayer: "ontology",
    tags: ["ontology", "business"],
  },
  creators: {
    category: "creators",
    entityTypes: ["person", "process", "object", "application", "theme", "event"],
    relationshipTypes: [
      ...UNIVERSAL_RELATIONSHIPS,
      "enables",
      "uses",
      "teaches",
    ],
    recordType: "ontology-creators",
    sourceLayer: "ontology",
    tags: ["ontology", "creators"],
  },
}

export function normalizeDomainCategory(category: string): DomainCategory {
  const normalized = category.trim().toLowerCase().replace(/_/g, "-")
  const exact = DOMAIN_ALIASES[normalized]

  if (exact) return exact
  if ((DOMAIN_CATEGORIES as readonly string[]).includes(normalized)) {
    return normalized as DomainCategory
  }

  return "ai-tools"
}

export function ontologyTypesForDomain(
  category: string | DomainCategory
): DomainOntologyTypes {
  return DOMAIN_ONTOLOGY_TYPES[normalizeDomainCategory(category)]
}

export function mapOntologyToSemanticGraphShape(
  result: OntologyExtractionResult
): SemanticGraphMappingShape {
  const domainTypes = ontologyTypesForDomain(result.category)
  const confidence = clamp(result.confidence ?? averageConfidence(result), 0, 1)
  const title = result.title.trim()

  return {
    records: [
      {
        title,
        content: buildRecordContent(result),
        recordType: domainTypes.recordType,
        sourceLayer: "ontology",
        sourceType: result.sourceType ?? null,
        sourceId: result.sourceId ?? null,
        importance: 75,
        confidence,
        tags: [...new Set([...domainTypes.tags, ...(result.themes ?? [])])],
        metadata: {
          category: result.category,
          topic: result.topic ?? null,
          entityCount: result.entities.length,
          relationshipCount: result.relationships.length,
          ...result.metadata,
        },
      },
    ],
    nodes: result.entities.map((entity) => ({
      nodeType: entity.type,
      name: entity.name,
      summary: entity.summary ?? null,
      importance: entity.importance ?? 70,
      sourceRecordTitle: title,
      metadata: {
        ontologyEntityId: entity.id ?? null,
        aliases: entity.aliases ?? [],
        confidence: entity.confidence ?? null,
        evidence: entity.evidence ?? [],
        ...entity.metadata,
      },
    })),
    edges: result.relationships.map((relationship) => ({
      sourceName: relationship.sourceEntityName,
      targetName: relationship.targetEntityName,
      relationType: relationship.type,
      strength: clamp(relationship.strength ?? relationship.confidence ?? 0.7, 0, 1),
      summary: relationship.summary ?? null,
      evidence: {
        ontologyRelationshipId: relationship.id ?? null,
        confidence: relationship.confidence ?? null,
        evidence: relationship.evidence ?? [],
        ...relationship.metadata,
      },
    })),
  }
}

function buildRecordContent(result: OntologyExtractionResult) {
  const entityNames = result.entities.map((entity) => entity.name).join(", ")
  const relationshipSummary = result.relationships
    .map(
      (relationship) =>
        `${relationship.sourceEntityName} ${relationship.type} ${relationship.targetEntityName}`
    )
    .join("; ")

  return [
    result.summary,
    entityNames ? `Entities: ${entityNames}.` : null,
    relationshipSummary ? `Relationships: ${relationshipSummary}.` : null,
  ]
    .filter(Boolean)
    .join(" ")
}

function averageConfidence(result: OntologyExtractionResult) {
  const values = [
    ...result.entities.map((entity) => entity.confidence),
    ...result.relationships.map((relationship) => relationship.confidence),
  ].filter((value): value is number => typeof value === "number")

  if (values.length === 0) return 0.75

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export { BASE_ENTITY_TYPES }
