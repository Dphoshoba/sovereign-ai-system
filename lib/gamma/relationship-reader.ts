import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { getResearchMissions } from "./research-registry"
import { getKnowledgeIntelligenceWorkspace } from "./knowledge-intelligence-reader"

export type RelationshipWorkspace =
  | "research"
  | "creator"
  | "ministry"
  | "executive"
  | "agency"
  | "shared-knowledge"
  | "second-brain"
  | "knowledge-intelligence"

export type RelationshipConnection = {
  source: string
  target: string
  relationship: string
  sourceWorkspace: RelationshipWorkspace
  targetWorkspace: RelationshipWorkspace
  notes: string
}

export type MissionRelationshipWorkspaceMetric = {
  workspace: RelationshipWorkspace
  inbound: number
  outbound: number
  total: number
}

export type MissionRelationshipGraph = {
  nodes: Array<{ id: string; label: string; type: "workspace" | "asset" | "mission" }>
  edges: Array<{ from: string; to: string; relationship: string }>
}

export type MissionRelationshipWorkspace = {
  mission: string
  missionTitle: string
  relationshipCount: number
  connectionCount: number
  coverageScore: number
  researchLinks: number
  creatorLinks: number
  ministryLinks: number
  executiveLinks: number
  agencyLinks: number
  knowledgeLinks: number
  workspaceCount: number
  connectedWorkspaces: RelationshipWorkspace[]
  workspaceMetrics: MissionRelationshipWorkspaceMetric[]
  relationshipTypes: string[]
  connections: RelationshipConnection[]
  graph: MissionRelationshipGraph
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

function readLinksFile(slug: string): RelationshipConnection[] {
  const filePath = join(process.cwd(), "gamma", "knowledge-links", `${slug}.json`)
  if (!existsSync(filePath)) {
    return []
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf-8")) as {
      mission?: string
      connections?: RelationshipConnection[]
    }
    return Array.isArray(parsed.connections) ? parsed.connections : []
  } catch {
    return []
  }
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function countWorkspaceLinks(connections: RelationshipConnection[], workspace: RelationshipWorkspace): number {
  let total = 0
  for (const connection of connections) {
    if (connection.sourceWorkspace === workspace || connection.targetWorkspace === workspace) {
      total += 1
    }
  }
  return total
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function getWorkspaceMetrics(connections: RelationshipConnection[]): MissionRelationshipWorkspaceMetric[] {
  const workspaces: RelationshipWorkspace[] = [
    "research",
    "creator",
    "ministry",
    "executive",
    "agency",
    "shared-knowledge",
    "second-brain",
    "knowledge-intelligence",
  ]

  return workspaces.map((workspace) => {
    let inbound = 0
    let outbound = 0
    for (const connection of connections) {
      if (connection.targetWorkspace === workspace) {
        inbound += 1
      }
      if (connection.sourceWorkspace === workspace) {
        outbound += 1
      }
    }
    return { workspace, inbound, outbound, total: inbound + outbound }
  })
}

function buildGraph(slug: string, missionTitle: string, connections: RelationshipConnection[]): MissionRelationshipGraph {
  const nodes: MissionRelationshipGraph["nodes"] = [{ id: `mission-${slug}`, label: missionTitle, type: "mission" }]
  const seenNodeIds = new Set<string>([nodes[0].id])

  const workspaceNodes = unique(
    connections.flatMap((connection) => [connection.sourceWorkspace, connection.targetWorkspace])
  )

  for (const workspace of workspaceNodes) {
    const id = `workspace-${workspace}`
    if (!seenNodeIds.has(id)) {
      seenNodeIds.add(id)
      nodes.push({ id, label: workspace, type: "workspace" })
    }
  }

  for (const connection of connections) {
    const sourceId = `asset-${connection.sourceWorkspace}-${connection.source}`
    const targetId = `asset-${connection.targetWorkspace}-${connection.target}`

    if (!seenNodeIds.has(sourceId)) {
      seenNodeIds.add(sourceId)
      nodes.push({ id: sourceId, label: `${connection.sourceWorkspace}/${connection.source}`, type: "asset" })
    }

    if (!seenNodeIds.has(targetId)) {
      seenNodeIds.add(targetId)
      nodes.push({ id: targetId, label: `${connection.targetWorkspace}/${connection.target}`, type: "asset" })
    }
  }

  const edges: MissionRelationshipGraph["edges"] = []
  for (const connection of connections) {
    edges.push({
      from: `asset-${connection.sourceWorkspace}-${connection.source}`,
      to: `asset-${connection.targetWorkspace}-${connection.target}`,
      relationship: connection.relationship,
    })
  }

  return { nodes, edges }
}

export async function getMissionRelationships(slug: string): Promise<MissionRelationshipWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((item) => item.slug === slug)
  if (!mission) {
    return null
  }

  const intelligence = await getKnowledgeIntelligenceWorkspace(slug)
  const connections = readLinksFile(slug)
  const relationshipTypes = unique(connections.map((connection) => connection.relationship))

  const connectedWorkspaces = unique(
    connections.flatMap((connection) => [connection.sourceWorkspace, connection.targetWorkspace])
  ) as RelationshipWorkspace[]

  const workspaceMetrics = getWorkspaceMetrics(connections)
  const workspaceCount = connectedWorkspaces.length
  const coverageScore = clamp(Math.floor((workspaceCount / 8) * 100), 0, 100)

  const graph = buildGraph(slug, mission.title, connections)

  const knowledgeLinks = countWorkspaceLinks(connections, "shared-knowledge") + countWorkspaceLinks(connections, "knowledge-intelligence")

  return {
    mission: slug,
    missionTitle: intelligence?.missionTitle ?? mission.title,
    relationshipCount: relationshipTypes.length,
    connectionCount: connections.length,
    coverageScore,
    researchLinks: countWorkspaceLinks(connections, "research"),
    creatorLinks: countWorkspaceLinks(connections, "creator"),
    ministryLinks: countWorkspaceLinks(connections, "ministry"),
    executiveLinks: countWorkspaceLinks(connections, "executive"),
    agencyLinks: countWorkspaceLinks(connections, "agency"),
    knowledgeLinks,
    workspaceCount,
    connectedWorkspaces,
    workspaceMetrics,
    relationshipTypes,
    connections,
    graph,
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

export async function getRelationshipRegistry(): Promise<{
  missionCount: number
  relationshipCount: number
  connectionCount: number
  coverageScore: number
  missions: MissionRelationshipWorkspace[]
}> {
  const missions = await getResearchMissions()
  const missionRelationships: MissionRelationshipWorkspace[] = []

  for (const mission of missions) {
    const relationships = await getMissionRelationships(mission.slug)
    if (relationships) {
      missionRelationships.push(relationships)
    }
  }

  const missionCount = missionRelationships.length
  const relationshipCount = missionRelationships.reduce((sum, item) => sum + item.relationshipCount, 0)
  const connectionCount = missionRelationships.reduce((sum, item) => sum + item.connectionCount, 0)
  const coverageScore =
    missionCount > 0
      ? Math.floor(missionRelationships.reduce((sum, item) => sum + item.coverageScore, 0) / missionCount)
      : 0

  return {
    missionCount,
    relationshipCount,
    connectionCount,
    coverageScore,
    missions: missionRelationships,
  }
}
