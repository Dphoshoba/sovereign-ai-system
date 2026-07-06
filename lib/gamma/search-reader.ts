import { existsSync, readdirSync, readFileSync } from "fs"
import { join } from "path"
import { getAgencyWorkspace } from "./agency-reader"
import { getCreatorWorkspace } from "./creator-output-reader"
import { getExecutiveWorkspace } from "./executive-reader"
import { getKnowledgeIntelligenceWorkspace } from "./knowledge-intelligence-reader"
import { getMinistryWorkspace } from "./ministry-reader"
import { getMission, getResearchMissions } from "./research-registry"
import { getSecondBrainWorkspace } from "./second-brain-reader"
import { getSharedKnowledgeWorkspace } from "./shared-knowledge-reader"

export type GammaSearchWorkspace =
  | "research"
  | "creator"
  | "ministry"
  | "executive"
  | "agency"
  | "shared-knowledge"
  | "second-brain"
  | "knowledge-intelligence"

export type GammaSearchAsset = {
  id: string
  mission: string
  workspace: GammaSearchWorkspace
  title: string
  content: string
  source: string
}

export type GammaSearchMatch = {
  id: string
  mission: string
  workspace: GammaSearchWorkspace
  title: string
  source: string
  snippet: string
}

export type GammaSearchResult = {
  query: string
  resultsCount: number
  missionCount: number
  workspaceCount: number
  matchedAssets: GammaSearchMatch[]
  coverageScore: number
  workspaces: GammaSearchWorkspace[]
  missions: string[]
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

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function extractSnippet(content: string, query: string): string {
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const needle = normalize(query)

  for (const line of lines) {
    if (normalize(line).includes(needle)) {
      return line.length > 180 ? `${line.slice(0, 177)}...` : line
    }
  }

  return lines[0] ?? "No content preview available"
}

function listMarkdownFiles(rootPath: string): string[] {
  if (!existsSync(rootPath)) {
    return []
  }

  const entries = readdirSync(rootPath, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = join(rootPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(fullPath))
      continue
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(fullPath)
    }
  }

  return files
}

function readMissionMarkdownAssets(slug: string, workspace: GammaSearchWorkspace): GammaSearchAsset[] {
  const folderName = workspace === "shared-knowledge" ? "shared-knowledge" : workspace
  const root = join(process.cwd(), "gamma", folderName, slug)
  const files = listMarkdownFiles(root)

  return files.map((filePath, index) => {
    const content = readFileSync(filePath, "utf-8")
    const fileName = filePath.split(/[\\/]/).pop() ?? "asset.md"
    return {
      id: `${slug}-${workspace}-file-${index}`,
      mission: slug,
      workspace,
      title: fileName,
      content,
      source: `gamma/${folderName}/${slug}/${fileName}`,
    }
  })
}

async function collectMissionAssets(slug: string): Promise<GammaSearchAsset[]> {
  const assets: GammaSearchAsset[] = []

  const research = await getMission(slug)
  const creator = await getCreatorWorkspace(slug)
  const ministry = await getMinistryWorkspace(slug)
  const executive = await getExecutiveWorkspace(slug)
  const agency = await getAgencyWorkspace(slug)
  const shared = await getSharedKnowledgeWorkspace(slug)
  const secondBrain = await getSecondBrainWorkspace(slug)
  const intelligence = await getKnowledgeIntelligenceWorkspace(slug)

  if (research) {
    assets.push({
      id: `${slug}-research-summary`,
      mission: slug,
      workspace: "research",
      title: research.name,
      content: [
        ...research.discoveries.map((item) => item.description),
        ...research.questions.map((item) => item.question),
        ...research.scriptureReferences.map((item) => item.text),
      ].join("\n"),
      source: `research-workspace/${slug}`,
    })
  }

  if (creator) {
    assets.push({
      id: `${slug}-creator-summary`,
      mission: slug,
      workspace: "creator",
      title: creator.name,
      content: [...creator.articleIdeas, ...creator.youtubeSeries, ...creator.bookOutlines, ...creator.courseOutlines].join("\n"),
      source: `creator-workspace/${slug}`,
    })
  }

  if (ministry) {
    assets.push({
      id: `${slug}-ministry-summary`,
      mission: slug,
      workspace: "ministry",
      title: ministry.name,
      content: [
        ...ministry.sermonSeries,
        ...ministry.bibleStudies,
        ...ministry.teachingCourses,
        ...ministry.kingdomPrinciples,
      ].join("\n"),
      source: `ministry-workspace/${slug}`,
    })
  }

  if (executive) {
    assets.push({
      id: `${slug}-executive-summary`,
      mission: slug,
      workspace: "executive",
      title: executive.name,
      content: [...executive.priorityList, ...executive.nextRecommendedActions].join("\n"),
      source: `executive-workspace/${slug}`,
    })
  }

  if (agency) {
    assets.push({
      id: `${slug}-agency-summary`,
      mission: slug,
      workspace: "agency",
      title: agency.name,
      content: [...agency.clientProposals, ...agency.servicePackages, ...agency.workshopPlans, ...agency.presentationOutlines].join("\n"),
      source: `agency-workspace/${slug}`,
    })
  }

  if (shared) {
    assets.push({
      id: `${slug}-shared-summary`,
      mission: slug,
      workspace: "shared-knowledge",
      title: shared.name,
      content: [
        ...shared.frameworks,
        ...shared.prompts,
        ...shared.templates,
        ...shared.discoveries,
        ...shared.crossReferences,
      ].join("\n"),
      source: `shared-knowledge/${slug}`,
    })
  }

  if (secondBrain) {
    assets.push({
      id: `${slug}-second-brain-summary`,
      mission: slug,
      workspace: "second-brain",
      title: secondBrain.name,
      content: [...secondBrain.crossWorkspaceSummary, ...secondBrain.recentDiscoveries, ...secondBrain.suggestedActions].join("\n"),
      source: `second-brain/${slug}`,
    })
  }

  if (intelligence) {
    assets.push({
      id: `${slug}-knowledge-intelligence-summary`,
      mission: slug,
      workspace: "knowledge-intelligence",
      title: intelligence.name,
      content: [
        ...intelligence.crossWorkspaceSummary,
        ...intelligence.insights,
        ...intelligence.patterns,
        ...intelligence.recommendations,
      ].join("\n"),
      source: `knowledge-intelligence/${slug}`,
    })
  }

  assets.push(...readMissionMarkdownAssets(slug, "research"))
  assets.push(...readMissionMarkdownAssets(slug, "creator"))
  assets.push(...readMissionMarkdownAssets(slug, "ministry"))
  assets.push(...readMissionMarkdownAssets(slug, "executive"))
  assets.push(...readMissionMarkdownAssets(slug, "agency"))
  assets.push(...readMissionMarkdownAssets(slug, "shared-knowledge"))

  return assets
}

function coverageScore(matchedWorkspaces: GammaSearchWorkspace[]): number {
  return Math.floor((matchedWorkspaces.length / 8) * 100)
}

export async function getGammaSearchResults(query: string): Promise<GammaSearchResult> {
  const normalizedQuery = query.trim()
  const missions = await getResearchMissions()

  if (!normalizedQuery) {
    return {
      query: "",
      resultsCount: 0,
      missionCount: 0,
      workspaceCount: 0,
      matchedAssets: [],
      coverageScore: 0,
      workspaces: [],
      missions: [],
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

  const assets: GammaSearchAsset[] = []
  for (const mission of missions) {
    const missionAssets = await collectMissionAssets(mission.slug)
    assets.push(...missionAssets)
  }

  const needle = normalize(normalizedQuery)

  const matchedAssets: GammaSearchMatch[] = assets
    .filter((asset) => normalize(`${asset.title}\n${asset.content}`).includes(needle))
    .map((asset) => ({
      id: asset.id,
      mission: asset.mission,
      workspace: asset.workspace,
      title: asset.title,
      source: asset.source,
      snippet: extractSnippet(asset.content, normalizedQuery),
    }))

  const matchedMissions = Array.from(new Set(matchedAssets.map((item) => item.mission)))
  const matchedWorkspaces = Array.from(new Set(matchedAssets.map((item) => item.workspace))) as GammaSearchWorkspace[]

  return {
    query: normalizedQuery,
    resultsCount: matchedAssets.length,
    missionCount: matchedMissions.length,
    workspaceCount: matchedWorkspaces.length,
    matchedAssets,
    coverageScore: coverageScore(matchedWorkspaces),
    workspaces: matchedWorkspaces,
    missions: matchedMissions,
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
