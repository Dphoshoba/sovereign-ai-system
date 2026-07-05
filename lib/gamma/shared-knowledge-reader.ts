import { existsSync, readFileSync } from "fs"
import { join, resolve, sep } from "path"
import { getMission } from "./research-registry"
import { getCreatorWorkspace } from "./creator-output-reader"
import { getMinistryWorkspace } from "./ministry-reader"
import { getExecutiveWorkspace } from "./executive-reader"
import { getAgencyWorkspace } from "./agency-reader"
import type {
  SharedKnowledgeAsset,
  SharedKnowledgeConfidence,
  SharedKnowledgeGraphEdge,
  SharedKnowledgeGraphNode,
  SharedKnowledgeWorkspace,
} from "../shared-knowledge/types"

function isValidMissionSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/i.test(slug)
}

function getMissionDirectory(slug: string): string | null {
  if (!isValidMissionSlug(slug)) {
    return null
  }

  const researchRoot = resolve(process.cwd(), "gamma", "research")
  const missionDir = resolve(researchRoot, slug)

  if (missionDir !== researchRoot && !missionDir.startsWith(`${researchRoot}${sep}`)) {
    return null
  }

  if (!existsSync(join(missionDir, "mission.md"))) {
    return null
  }

  return missionDir
}

function readTextFile(missionDir: string, filename: string): string {
  try {
    return readFileSync(join(missionDir, filename), "utf-8")
  } catch {
    return ""
  }
}

function cleanLines(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line !== "---")
    .filter((line) => !line.startsWith("#"))
    .filter((line) => !line.startsWith("\\#"))
    .filter((line) => !line.startsWith("\\-"))
    .filter((line) => !line.startsWith("##"))
    .filter((line) => !/^(Title|Knowledge Domain|Category|Status|Phase|Confidence|Owner|Primary Workspace|Related Workspaces|Created):/i.test(line))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function confidenceFromScore(score: number): SharedKnowledgeConfidence {
  if (score >= 85) {
    return "very-high"
  }
  if (score >= 65) {
    return "high"
  }
  if (score >= 45) {
    return "moderate"
  }
  return "low"
}

function normalizeLabel(value: string): string {
  return value
    .replace(/^[-*]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .trim()
}

function extractScriptureRefs(content: string): string[] {
  const regex = /([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+(?:[-–]\d+)?)/g
  const refs: string[] = []
  let match: RegExpExecArray | null = regex.exec(content)
  while (match) {
    refs.push(`${match[1].trim()} ${match[2]}:${match[3].replace("–", "-")}`)
    match = regex.exec(content)
  }
  return unique(refs)
}

function buildAsset(
  id: string,
  title: string,
  category: SharedKnowledgeAsset["category"],
  domain: string,
  confidence: SharedKnowledgeConfidence,
  tags: string[],
  crossReferences: string[],
  relatedMissions: string[],
  suggestedApplications: string[],
  status: SharedKnowledgeAsset["status"] = "curated"
): SharedKnowledgeAsset {
  return {
    id,
    title,
    category,
    domain,
    confidence,
    status,
    tags: unique(tags),
    crossReferences: unique(crossReferences),
    relatedMissions: unique(relatedMissions),
    suggestedApplications: unique(suggestedApplications),
  }
}

export async function getSharedKnowledgeWorkspace(slug: string): Promise<SharedKnowledgeWorkspace | null> {
  const missionDir = getMissionDirectory(slug)
  if (!missionDir) {
    return null
  }

  const research = await getMission(slug)
  const creator = await getCreatorWorkspace(slug)
  const ministry = await getMinistryWorkspace(slug)
  const executive = await getExecutiveWorkspace(slug)
  const agency = await getAgencyWorkspace(slug)

  if (!research || !creator || !ministry || !executive || !agency) {
    return null
  }

  const missionMd = readTextFile(missionDir, "mission.md")
  const discoveriesMd = readTextFile(missionDir, "discoveries.md")
  const questionsMd = readTextFile(missionDir, "questions.md")
  const scripturesMd = readTextFile(missionDir, "scriptures.md")
  const timelineMd = readTextFile(missionDir, "timeline.md")

  const discoveryLines = unique([
    ...research.discoveries.map((item) => normalizeLabel(item.title || item.description)),
    ...cleanLines(discoveriesMd).slice(0, 12).map((line) => normalizeLabel(line)),
  ]).slice(0, 12)

  const principleLines = unique([
    ...ministry.kingdomPrinciples.map((line) => normalizeLabel(line)),
    ...ministry.insights.slice(0, 6).map((line) => normalizeLabel(line)),
  ]).slice(0, 12)

  const frameworkLines = unique([
    ...agency.servicePackages.map((line) => normalizeLabel(line)),
    ...executive.priorityList.map((line) => `Framework: ${normalizeLabel(line)}`),
    "Framework: Research to Reusable Knowledge",
  ]).slice(0, 10)

  const promptLines = unique([
    ...cleanLines(questionsMd)
      .filter((line) => line.endsWith("?"))
      .map((line) => normalizeLabel(line)),
    ...ministry.smallGroupResources.map((line) => normalizeLabel(line)),
  ]).slice(0, 14)

  const templateLines = unique([
    ...agency.offerTemplates.map((line) => normalizeLabel(line)),
    ...agency.clientProposals.map((line) => normalizeLabel(line)),
  ]).slice(0, 10)

  const scriptLines = unique([
    ...creator.youtubeSeries.map((line) => normalizeLabel(line)),
    ...agency.presentationOutlines.map((line) => normalizeLabel(line)),
  ]).slice(0, 10)

  const teachingModels = unique([
    ...ministry.teachingCourses.map((line) => normalizeLabel(line)),
    ...ministry.sermonSeries.map((line) => normalizeLabel(line)),
  ]).slice(0, 10)

  const bookStructures = unique(creator.bookOutlines.map((line) => normalizeLabel(line))).slice(0, 10)
  const courseStructures = unique(creator.courseOutlines.map((line) => normalizeLabel(line))).slice(0, 10)
  const serviceModels = unique(agency.servicePackages.map((line) => normalizeLabel(line))).slice(0, 10)

  const reusableComponents = unique([
    ...frameworkLines.slice(0, 4).map((line) => `Reusable Component: ${line}`),
    ...templateLines.slice(0, 3).map((line) => `Reusable Component: ${line}`),
    ...teachingModels.slice(0, 3).map((line) => `Reusable Component: ${line}`),
  ]).slice(0, 12)

  const scriptureRefs = extractScriptureRefs(scripturesMd)
  const crossReferences = unique([
    ...scriptureRefs,
    ...ministry.crossReferences,
    ...agency.crossReferences,
    ...executive.blockedCapabilities.map((capability) => `Constraint: ${capability}`),
  ]).slice(0, 28)

  const domains = unique([
    ...research.domains.map((d) => d.domain),
    "teaching",
    "strategy",
    "service",
  ])

  const tags = unique([
    slug,
    "shared-knowledge",
    "discoveries",
    "frameworks",
    "prompts",
    "templates",
    ...domains.map((domain) => domain.toLowerCase()),
  ]).slice(0, 20)

  const suggestedApplications = unique([
    "Build curriculum packs from scripture-backed principles",
    "Convert discovery prompts into reusable facilitation scripts",
    "Package frameworks for consulting and advisory delivery",
    "Map cross references into search-ready mission playbooks",
    ...agency.roadmaps.slice(0, 2).map((line) => `Apply in roadmap: ${line}`),
  ]).slice(0, 10)

  const relatedMissions: SharedKnowledgeWorkspace["relatedMissions"] = [
    {
      id: slug,
      title: research.name,
      status: research.status,
    },
  ]

  const timelineLines = cleanLines(timelineMd)
  const timeline: SharedKnowledgeWorkspace["timeline"] = [
    { date: "2026-07-02", event: "Research discoveries captured", status: "completed" },
    { date: "2026-07-03", event: "Creator assets promoted to reusable structures", status: "completed" },
    { date: "2026-07-04", event: "Ministry principles linked to knowledge domains", status: "completed" },
    { date: "2026-07-05", event: "Agency frameworks curated into shared assets", status: "in-progress" },
    {
      date: "2026-07-05",
      event: timelineLines[0] ? `Timeline source loaded: ${normalizeLabel(timelineLines[0])}` : "Knowledge graph preview assembled",
      status: "planned",
    },
  ]

  const missionTitleMatch = missionMd.match(/Title:\s*([^\n]+)/i)
  const missionTitle = missionTitleMatch ? missionTitleMatch[1].trim() : research.name

  const confidenceScoreRaw = Math.floor(
    research.overallProgress * 0.25 +
      creator.progress * 0.2 +
      ministry.progress * 0.2 +
      executive.readinessScore * 0.2 +
      agency.progress * 0.15
  )
  const knowledgeHealthScore = confidenceScoreRaw > 96 ? 96 : confidenceScoreRaw
  const confidence = confidenceFromScore(knowledgeHealthScore)

  let assetIndex = 1
  const assetTags = [slug, "governed", "reusable", "preview"]
  const relatedMissionIds = [slug]

  const knowledgeAssets: SharedKnowledgeAsset[] = []
  for (const item of discoveryLines) {
    knowledgeAssets.push(
      buildAsset(
        `asset-${assetIndex++}`,
        item,
        "discovery",
        "research",
        confidence,
        [...assetTags, "discovery"],
        crossReferences.slice(0, 4),
        relatedMissionIds,
        ["Research summary", "Teaching insights"]
      )
    )
  }
  for (const item of principleLines.slice(0, 8)) {
    knowledgeAssets.push(
      buildAsset(
        `asset-${assetIndex++}`,
        item,
        "principle",
        "ministry",
        confidence,
        [...assetTags, "principle"],
        crossReferences.slice(0, 4),
        relatedMissionIds,
        ["Sermon planning", "Discipleship discussion"]
      )
    )
  }
  for (const item of frameworkLines.slice(0, 6)) {
    knowledgeAssets.push(
      buildAsset(
        `asset-${assetIndex++}`,
        item,
        "framework",
        "agency",
        confidence,
        [...assetTags, "framework"],
        crossReferences.slice(0, 3),
        relatedMissionIds,
        ["Service design", "Client delivery model"]
      )
    )
  }
  for (const item of promptLines.slice(0, 8)) {
    knowledgeAssets.push(
      buildAsset(
        `asset-${assetIndex++}`,
        item,
        "prompt",
        "creator",
        confidence,
        [...assetTags, "prompt"],
        crossReferences.slice(0, 2),
        relatedMissionIds,
        ["Writing prompts", "Workshop facilitation"]
      )
    )
  }
  for (const item of templateLines.slice(0, 6)) {
    knowledgeAssets.push(
      buildAsset(
        `asset-${assetIndex++}`,
        item,
        "template",
        "agency",
        confidence,
        [...assetTags, "template"],
        crossReferences.slice(0, 2),
        relatedMissionIds,
        ["Proposal pack", "Offer creation"]
      )
    )
  }

  const frameworkCount = frameworkLines.length
  const promptCount = promptLines.length
  const templateCount = templateLines.length
  const discoveryCount = discoveryLines.length
  const crossReferenceCount = crossReferences.length
  const domainCount = domains.length
  const timelineCount = timeline.length
  const assetCount = knowledgeAssets.length

  const searchPreview = unique([
    ...knowledgeAssets.slice(0, 5).map((asset) => `${asset.category}: ${asset.title}`),
    ...frameworkLines.slice(0, 2).map((line) => `framework: ${line}`),
    ...templateLines.slice(0, 2).map((line) => `template: ${line}`),
  ]).slice(0, 12)

  const graphNodes: SharedKnowledgeGraphNode[] = [
    ...domains.slice(0, 5).map((domain) => ({
      id: `domain-${domain}`,
      label: domain,
      type: "domain" as const,
    })),
    ...knowledgeAssets.slice(0, 8).map((asset) => ({
      id: asset.id,
      label: asset.title,
      type: "asset" as const,
    })),
    {
      id: `mission-${slug}`,
      label: missionTitle,
      type: "mission" as const,
    },
  ]

  const graphEdges: SharedKnowledgeGraphEdge[] = []
  for (const asset of knowledgeAssets.slice(0, 8)) {
    const domainNode = graphNodes.find((node) => node.type === "domain")
    if (domainNode) {
      graphEdges.push({ from: domainNode.id, to: asset.id, relation: "contains" })
    }
    graphEdges.push({ from: `mission-${slug}`, to: asset.id, relation: "promotes" })
  }

  return {
    id: slug,
    name: "Shared Knowledge Layer",
    missionTitle,
    status: "active",
    confidence,
    knowledgeHealthScore,
    assetCount,
    frameworkCount,
    promptCount,
    templateCount,
    discoveryCount,
    crossReferenceCount,
    domainCount,
    timelineCount,
    knowledgeDomains: domains,
    knowledgeCategories: [
      "discoveries",
      "principles",
      "frameworks",
      "prompts",
      "templates",
      "scripts",
      "teaching-models",
      "book-structures",
      "course-structures",
      "service-models",
      "reusable-components",
    ],
    knowledgeAssets,
    discoveries: discoveryLines,
    principles: principleLines,
    frameworks: frameworkLines,
    prompts: promptLines,
    templates: templateLines,
    scripts: scriptLines,
    teachingModels,
    bookStructures,
    courseStructures,
    serviceModels,
    reusableComponents,
    crossReferences,
    tags,
    timeline,
    relatedMissions,
    suggestedApplications,
    searchPreview,
    knowledgeGraphPreview: {
      nodes: graphNodes,
      edges: graphEdges,
    },
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
