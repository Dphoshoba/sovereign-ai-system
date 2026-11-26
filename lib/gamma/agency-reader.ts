import { existsSync, readFileSync } from "fs"
import { join, resolve, sep } from "path"
import { getMission } from "./research-registry"
import { getCreatorWorkspace } from "./creator-output-reader"
import { getMinistryWorkspace } from "./ministry-reader"
import { getExecutiveWorkspace } from "./executive-reader"
import type { AgencyConfidence, AgencyWorkspace } from "../agency-workspace/types"

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
    .filter((line) => !line.startsWith("#"))
    .filter((line) => line !== "---")
    .filter((line) => !line.startsWith("\\#"))
    .filter((line) => !line.startsWith("\\-"))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values))
}

function confidenceFromProgress(progress: number): AgencyConfidence {
  if (progress >= 85) {
    return "very-high"
  }
  if (progress >= 65) {
    return "high"
  }
  if (progress >= 45) {
    return "moderate"
  }
  return "low"
}

function scriptureRefs(content: string): string[] {
  const regex = /([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+(?:-\d+)?)/g
  const refs: string[] = []
  let match: RegExpExecArray | null = regex.exec(content)
  while (match) {
    refs.push(`${match[1].trim()} ${match[2]}:${match[3]}`)
    match = regex.exec(content)
  }
  return unique(refs)
}

function titleFromMission(content: string, slug: string): string {
  const titleMatch = content.match(/Title:\s*([^\n]+)/i)
  return titleMatch ? titleMatch[1].trim() : `Research Mission — ${slug}`
}

export async function getAgencyWorkspace(slug: string): Promise<AgencyWorkspace | null> {
  const missionDir = getMissionDirectory(slug)
  if (!missionDir) {
    return null
  }

  const research = await getMission(slug)
  const creator = await getCreatorWorkspace(slug)
  const ministry = await getMinistryWorkspace(slug)
  const executive = await getExecutiveWorkspace(slug)

  if (!research || !creator || !ministry || !executive) {
    return null
  }

  const missionMd = readTextFile(missionDir, "mission.md")
  const discoveriesMd = readTextFile(missionDir, "discoveries.md")
  const questionsMd = readTextFile(missionDir, "questions.md")
  const scripturesMd = readTextFile(missionDir, "scriptures.md")
  const bookOutlineMd = readTextFile(missionDir, "book-outline.md")
  const courseOutlineMd = readTextFile(missionDir, "course-outline.md")
  const youtubeSeriesMd = readTextFile(missionDir, "youtube-series.md")
  const articlesMd = readTextFile(missionDir, "articles.md")

  const missionTitle = titleFromMission(missionMd, slug)
  const discoveryLines = cleanLines(discoveriesMd)
  const questionLines = cleanLines(questionsMd).filter((line) => line.endsWith("?"))
  const scriptureLines = scriptureRefs(scripturesMd)
  const bookLines = cleanLines(bookOutlineMd)
  const courseLines = cleanLines(courseOutlineMd)
  const youtubeLines = cleanLines(youtubeSeriesMd)
  const articleLines = cleanLines(articlesMd)

  const clientProposals = unique([
    `Proposal: ${missionTitle} Transformation Engagement`,
    `Proposal: ${creator.name} Content Engine Delivery`,
    `Proposal: ${ministry.name} Teaching Systems Rollout`,
  ])

  const servicePackages = unique([
    "Package: Mission Strategy Intensive",
    "Package: Content-to-Client Conversion",
    "Package: Workshop and Training Deployment",
  ])

  const discoveryDocuments = unique([
    `Discovery Brief: ${missionTitle}`,
    ...questionLines.slice(0, 4).map((q) => `Discovery Question: ${q}`),
  ])

  const workshopPlans = unique([
    ...courseLines.slice(0, 4).map((line) => `Workshop Plan: ${line}`),
    ...youtubeLines.slice(0, 2).map((line) => `Workshop Session: ${line}`),
  ])
  const normalizedWorkshopPlans = workshopPlans.length > 0 ? workshopPlans : ["Workshop Plan: Womanhood Foundations"]

  const consultingDeliverables = unique([
    ...discoveryLines.slice(0, 4).map((line) => `Deliverable: ${line}`),
    `Deliverable: Executive Readiness Score ${executive.readinessScore}`,
  ])

  const presentationOutlines = unique([
    ...articleLines.slice(0, 4).map((line) => `Presentation: ${line}`),
    "Presentation: Mission to Market Narrative",
  ])

  const caseStudies = unique([
    "Case Study: Research to Creator System",
    "Case Study: Creator to Ministry Translation",
    "Case Study: Executive Readiness Governance",
  ])

  const offerTemplates = unique([
    "Offer Template: Discovery Sprint",
    "Offer Template: Workshop Program",
    "Offer Template: Advisory Retainer",
  ])

  const roadmaps = unique([
    "Roadmap: 30-Day Discovery and Offer Validation",
    "Roadmap: 60-Day Client Delivery Build",
    "Roadmap: 90-Day Scale and Governance",
  ])

  const crossReferences = unique([
    ...scriptureLines.slice(0, 12),
    ...creator.articleIdeas.slice(0, 3),
    ...ministry.crossReferences.slice(0, 3),
  ])

  const proposalCount = clientProposals.length
  const packageCount = servicePackages.length
  const offerCount = offerTemplates.length
  const workshopCount = normalizedWorkshopPlans.length

  const progressBase = Math.floor(
    research.overallProgress * 0.25 +
      creator.progress * 0.25 +
      ministry.progress * 0.25 +
      executive.readinessScore * 0.25
  )
  const progress = progressBase > 95 ? 95 : progressBase
  const confidence = confidenceFromProgress(progress)

  const timeline: AgencyWorkspace["timeline"] = [
    { date: "2026-07-02", event: "Research mission established", status: "completed" },
    { date: "2026-07-03", event: "Creator output mapped to offers", status: "completed" },
    { date: "2026-07-04", event: "Ministry assets translated to workshops", status: "in-progress" },
    { date: "2026-07-05", event: "Executive readiness integrated", status: "in-progress" },
    { date: "2026-07-05", event: "Agency workspace preview generated", status: "planned" },
  ]

  const pipelineStage: AgencyWorkspace["pipelineStage"] =
    progress >= 70 ? "delivery" : progress >= 45 ? "proposal" : "discovery"

  return {
    id: slug,
    name: "Agency Workspace",
    relatedMission: missionTitle,
    progress,
    confidence,
    pipelineStage,
    projectStatus: "active",
    valueProposition:
      "Transform deep research and content systems into client-ready service offers and delivery roadmaps.",
    revenuePotential: progress >= 60 ? "High" : "Medium",
    nextSuggestedService: "Launch Workshop and Advisory package from womanhood mission outputs",
    proposalCount,
    offerCount,
    workshopCount,
    packageCount,
    timelineCount: timeline.length,
    clientProposals,
    servicePackages,
    discoveryDocuments,
    workshopPlans: normalizedWorkshopPlans,
    consultingDeliverables,
    presentationOutlines,
    caseStudies,
    offerTemplates,
    roadmaps,
    crossReferences,
    timeline,
    relatedMissions: [{ id: slug, title: missionTitle, status: research.status }],
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
