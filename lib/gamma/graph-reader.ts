import { getMissionRelationships } from "./relationship-reader"
import { getResearchMissions } from "./research-registry"

export type KnowledgeGraphNode = {
  id: string
  label: string
  type: "workspace" | "asset" | "mission"
}

export type KnowledgeGraphEdge = {
  from: string
  to: string
  relationship: string
}

export type KnowledgeGraphWorkspace = {
  mission: string
  missionTitle: string
  nodeCount: number
  edgeCount: number
  missionCount: number
  assetCount: number
  coverageScore: number
  nodes: KnowledgeGraphNode[]
  edges: KnowledgeGraphEdge[]
  chainView: string[]
  readOnly: true
  previewOnly: true
  noAuth: true
  noSessions: true
  noJwt: true
  noDatabase: true
  noExecution: true
  noPublishing: true
  noOpenAI: true
  noGraphWrites: true
  noSocialPosting: true
}

export async function getMissionKnowledgeGraph(slug: string): Promise<KnowledgeGraphWorkspace | null> {
  const relationships = await getMissionRelationships(slug)
  if (!relationships) {
    return null
  }

  const nodes = relationships.graph.nodes
  const edges = relationships.graph.edges

  const assetCount = nodes.filter((node) => node.type === "asset").length

  return {
    mission: slug,
    missionTitle: relationships.missionTitle,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    missionCount: 1,
    assetCount,
    coverageScore: relationships.coverageScore,
    nodes,
    edges,
    chainView: [
      "Research",
      "Discoveries",
      "Creator",
      "Ministry",
      "Executive",
      "Agency",
      "Shared Knowledge",
      "Second Brain",
      "Knowledge Intelligence",
    ],
    readOnly: true,
    previewOnly: true,
    noAuth: true,
    noSessions: true,
    noJwt: true,
    noDatabase: true,
    noExecution: true,
    noPublishing: true,
    noOpenAI: true,
    noGraphWrites: true,
    noSocialPosting: true,
  }
}

export async function getKnowledgeGraphRegistry(): Promise<{
  missionCount: number
  nodeCount: number
  edgeCount: number
  assetCount: number
  coverageScore: number
  missions: KnowledgeGraphWorkspace[]
}> {
  const missions = await getResearchMissions()
  const graphs: KnowledgeGraphWorkspace[] = []

  for (const mission of missions) {
    const graph = await getMissionKnowledgeGraph(mission.slug)
    if (graph) {
      graphs.push(graph)
    }
  }

  const missionCount = graphs.length
  const nodeCount = graphs.reduce((sum, graph) => sum + graph.nodeCount, 0)
  const edgeCount = graphs.reduce((sum, graph) => sum + graph.edgeCount, 0)
  const assetCount = graphs.reduce((sum, graph) => sum + graph.assetCount, 0)
  const coverageScore = missionCount > 0 ? Math.floor(graphs.reduce((sum, graph) => sum + graph.coverageScore, 0) / missionCount) : 0

  return {
    missionCount,
    nodeCount,
    edgeCount,
    assetCount,
    coverageScore,
    missions: graphs,
  }
}
