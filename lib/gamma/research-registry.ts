import { readdirSync, readFileSync, existsSync } from "fs"
import { join } from "path"
import { getResearchWorkspace } from "./markdown-reader"
import { ResearchWorkspace, ConfidenceLevel } from "../research-workspace/types"

const REGISTRY_GENERATED_ISO = "2026-07-06T00:00:00.000Z"

function deterministicRegistryDate(): Date {
  const epoch = Date.parse(REGISTRY_GENERATED_ISO)
  return {
    getTime: () => epoch,
    toISOString: () => REGISTRY_GENERATED_ISO,
    toString: () => REGISTRY_GENERATED_ISO,
    valueOf: () => epoch,
  } as unknown as Date
}

/**
 * Mission Registry Card - Lightweight summary for dashboard listing
 * Used by browse page to show all available missions
 */
export type MissionRegistryCard = {
  slug: string
  title: string
  domain: string
  status: string
  phase: string
  confidence: ConfidenceLevel
  progress: number
  questions: number
  discoveries: number
  scriptures: number
  created: Date
}

/**
 * Mission Metadata - Core metadata extracted from mission.md
 * Used for quick lookups without full workspace load
 */
export type MissionMetadata = {
  slug: string
  title: string
  domain: string
  status: string
  phase: string
  confidence: ConfidenceLevel
  owner?: string
  created: Date
}

/**
 * Scans gamma/research/ directory and discovers all missions
 * A mission is defined by the presence of mission.md in a directory
 * Returns lightweight mission cards for dashboard listing
 *
 * Gamma Preview Mode:
 * - Read-only file system scan
 * - No database queries
 * - No external API calls
 * - Deterministic results
 */
export async function getResearchMissions(): Promise<MissionRegistryCard[]> {
  const researchPath = join(process.cwd(), "gamma", "research")
  const missions: MissionRegistryCard[] = []

  try {
    const dirs = readdirSync(researchPath, { withFileTypes: true })
    const dirNames = dirs.filter((d) => d.isDirectory()).map((d) => d.name)

    for (const dirName of dirNames) {
      const missionMdPath = join(researchPath, dirName, "mission.md")

      // Mission exists only if mission.md is present
      if (existsSync(missionMdPath)) {
        try {
          const workspace = await getResearchWorkspace(dirName)
          if (!workspace) {
            continue
          }
          const card: MissionRegistryCard = {
            slug: dirName,
            title: workspace.name,
            domain: workspace.domains.length > 0 ? workspace.domains[0].domain : "General Research",
            status: workspace.status,
            phase: "Discovery",
            confidence: workspace.overallConfidence,
            progress: workspace.overallProgress,
            questions: workspace.questionCount,
            discoveries: workspace.discoveryCount,
            scriptures: workspace.scriptureReferenceCount,
            created: workspace.createdAt,
          }
          missions.push(card)
        } catch (error) {
          console.warn(`Failed to load workspace for ${dirName}:`, error)
        }
      }
    }
  } catch (error) {
    console.warn("Failed to scan research directory:", error)
  }

  // Sort by creation date, most recent first
  missions.sort((a, b) => b.created.getTime() - a.created.getTime())
  return missions
}

/**
 * Gets metadata for a specific mission without loading the full workspace
 * Useful for quick lookups or lightweight API responses
 */
export function getMissionMetadata(slug: string): MissionMetadata | null {
  const researchPath = join(process.cwd(), "gamma", "research", slug)
  const missionMdPath = join(researchPath, "mission.md")

  if (!existsSync(missionMdPath)) {
    return null
  }

  try {
    const content = readFileSync(missionMdPath, "utf-8")

    const titleMatch = content.match(/Title:\s*([^\n]+)/i)
    const domainMatch = content.match(/Knowledge Domain:\s*([^\n]+)/i)
    const statusMatch = content.match(/Status:\s*([^\n]+)/i)
    const phaseMatch = content.match(/Phase:\s*([^\n]+)/i)
    const confidenceMatch = content.match(/Confidence:\s*([^\n]+)/i)
    const ownerMatch = content.match(/Owner:\s*([^\n]+)/i)

    const title = titleMatch ? titleMatch[1].trim() : `Research Mission — ${slug}`
    const domain = domainMatch ? domainMatch[1].trim() : "General Research"
    const status = statusMatch ? statusMatch[1].trim() : "Active"
    const phase = phaseMatch ? phaseMatch[1].trim() : "Discovery"
    const confidenceStr = confidenceMatch ? confidenceMatch[1].trim().toLowerCase() : "low"
    const owner = ownerMatch ? ownerMatch[1].trim() : undefined

    // Map confidence string to enum value
    const confidenceMap: Record<string, ConfidenceLevel> = {
      "very-high": "very-high",
      high: "high",
      moderate: "moderate",
      low: "low",
      "early exploration": "low",
      established: "high",
      mature: "very-high",
    }
    const confidence: ConfidenceLevel = confidenceMap[confidenceStr] || "low"

    return {
      slug,
      title,
      domain,
      status,
      phase,
      confidence,
      owner,
      created: new Date(2026, 6, 1), // Deterministic creation date
    }
  } catch (error) {
    console.warn(`Failed to read metadata for ${slug}:`, error)
    return null
  }
}

/**
 * Gets progress information for a specific mission
 * Returns key metrics for status indicators and progress tracking
 */
export async function getMissionProgress(
  slug: string
): Promise<{
  progress: number
  questions: number
  discoveries: number
  scriptures: number
  confidence: ConfidenceLevel
} | null> {
  try {
    const workspace = await getResearchWorkspace(slug)
    if (!workspace) {
      return null
    }
    return {
      progress: workspace.overallProgress,
      questions: workspace.questionCount,
      discoveries: workspace.discoveryCount,
      scriptures: workspace.scriptureReferenceCount,
      confidence: workspace.overallConfidence,
    }
  } catch (error) {
    console.warn(`Failed to get progress for ${slug}:`, error)
    return null
  }
}

/**
 * Gets the full ResearchWorkspace for a mission by slug
 * Delegates to markdown-reader for full data loading
 * Can also accept numeric IDs for backwards compatibility
 */
export async function getMission(slug: string): Promise<ResearchWorkspace | null> {
  try {
    // Map numeric IDs to slugs for backwards compatibility
    const actualSlug = slug === "1" ? "womanhood" : slug

    const workspace = await getResearchWorkspace(actualSlug)
    return workspace ?? null
  } catch (error) {
    console.warn(`Failed to get mission ${slug}:`, error)
    return null
  }
}

/**
 * Checks if a mission with the given slug exists
 */
export function missionExists(slug: string): boolean {
  const researchPath = join(process.cwd(), "gamma", "research", slug)
  const missionMdPath = join(researchPath, "mission.md")
  return existsSync(missionMdPath)
}

/**
 * Gets all available mission slugs
 * Useful for static generation and route discovery
 */
export async function getAllMissionSlugs(): Promise<string[]> {
  const missions = await getResearchMissions()
  return missions.map((m) => m.slug)
}

/**
 * Gets all available missions as a registry
 * Suitable for build-time generation of index files
 */
export async function getResearchRegistry(): Promise<{
  missions: Array<{
    slug: string
    title: string
    domain: string
    status: string
    phase: string
  }>
  generated: Date
  count: number
}> {
  const missions = await getResearchMissions()
  return {
    missions: missions.map((m) => ({
      slug: m.slug,
      title: m.title,
      domain: m.domain,
      status: m.status,
      phase: m.phase,
    })),
    generated: deterministicRegistryDate(),
    count: missions.length,
  }
}
