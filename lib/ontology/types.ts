export const DOMAIN_CATEGORIES = [
  "ai-tools",
  "bible-stories",
  "history",
  "health",
  "space",
  "motivation",
  "business",
  "creators",
] as const

export type DomainCategory = (typeof DOMAIN_CATEGORIES)[number]

export type OntologyEntityType =
  | "person"
  | "place"
  | "event"
  | "process"
  | "object"
  | "theme"
  | "application"

export type OntologyRelationshipType =
  | "associated-with"
  | "causes"
  | "challenges"
  | "confronts"
  | "contrasts-with"
  | "depends-on"
  | "demonstrates"
  | "develops-into"
  | "enables"
  | "influences"
  | "located-in"
  | "participates-in"
  | "precedes"
  | "reveals"
  | "supports"
  | "teaches"
  | "uses"

export type OntologyEvidence = {
  sourceTitle?: string
  sourceUrl?: string
  quote?: string
  confidence?: number
}

export type OntologyEntity = {
  id?: string
  type: OntologyEntityType
  name: string
  summary?: string
  aliases?: string[]
  importance?: number
  confidence?: number
  evidence?: OntologyEvidence[]
  metadata?: Record<string, unknown>
}

export type OntologyRelationship = {
  id?: string
  type: OntologyRelationshipType
  sourceEntityName: string
  targetEntityName: string
  summary?: string
  strength?: number
  confidence?: number
  evidence?: OntologyEvidence[]
  metadata?: Record<string, unknown>
}

export type OntologyExtractionResult = {
  category: DomainCategory
  title: string
  summary?: string
  topic?: string
  sourceLayer?: string
  sourceType?: string
  sourceId?: string
  entities: OntologyEntity[]
  relationships: OntologyRelationship[]
  themes?: string[]
  confidence?: number
  metadata?: Record<string, unknown>
}

export type DomainOntologyTypes = {
  category: DomainCategory
  entityTypes: OntologyEntityType[]
  relationshipTypes: OntologyRelationshipType[]
  recordType: string
  sourceLayer: "ontology"
  tags: string[]
}

export type SemanticGraphRecordShape = {
  title: string
  content: string
  recordType: string
  sourceLayer: "ontology"
  sourceType: string | null
  sourceId: string | null
  importance: number
  confidence: number
  tags: string[]
  metadata: Record<string, unknown>
}

export type SemanticGraphNodeShape = {
  nodeType: OntologyEntityType
  name: string
  summary: string | null
  importance: number
  sourceRecordTitle: string
  metadata: Record<string, unknown>
}

export type SemanticGraphEdgeShape = {
  sourceName: string
  targetName: string
  relationType: OntologyRelationshipType
  strength: number
  summary: string | null
  evidence: Record<string, unknown>
}

export type SemanticGraphMappingShape = {
  records: SemanticGraphRecordShape[]
  nodes: SemanticGraphNodeShape[]
  edges: SemanticGraphEdgeShape[]
}
