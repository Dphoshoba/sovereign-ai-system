import { existsSync, readFileSync } from "fs"
import { join, resolve, sep } from "path"
import type { MinistryWorkspace } from "../ministry-workspace/types"

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

function extractLines(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("#"))
    .filter((line) => line !== "---")
    .filter((line) => !line.startsWith("\\#"))
    .filter((line) => !line.startsWith("\\-"))
    .filter((line) => !/^(Title|Knowledge Domain|Category|Status|Phase|Confidence|Owner|Primary Workspace|Related Workspaces|Created):/i.test(line))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values))
}

function parseMissionTitle(content: string, slug: string): string {
  const titleMatch = content.match(/Title:\s*([^\n]+)/i)
  return titleMatch ? titleMatch[1].trim() : `Research Mission — ${slug}`
}

function parseScriptureRefs(content: string): string[] {
  const refs: string[] = []
  const regex = /([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+(?:-\d+)?)/g
  let match: RegExpExecArray | null = regex.exec(content)
  while (match) {
    refs.push(`${match[1].trim()} ${match[2]}:${match[3]}`)
    match = regex.exec(content)
  }
  return unique(refs)
}

function parseQuestionLines(content: string): string[] {
  return extractLines(content).filter((line) => line.endsWith("?"))
}

function parseThemes(content: string): string[] {
  const lines = content.split(/\r?\n/).map((line) => line.trim())
  const themes: string[] = []
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].toLowerCase() === "themes") {
      let j = i + 1
      while (j < lines.length && lines[j].startsWith("-")) {
        const value = lines[j].replace(/^-\s*/, "").trim()
        if (value) {
          themes.push(value)
        }
        j += 1
      }
    }
  }
  const base = unique(themes)
  if (base.length > 0) {
    return base
  }
  return ["Identity", "Compassion", "Nurture", "Wisdom", "Leadership", "Legacy"]
}

function fallbackItems(items: string[], fallback: string): string[] {
  return items.length > 0 ? items : [fallback]
}

export async function getMinistryWorkspace(slug: string): Promise<MinistryWorkspace | null> {
  const missionDir = getMissionDirectory(slug)
  if (!missionDir) {
    return null
  }

  const missionMd = readTextFile(missionDir, "mission.md")
  const discoveriesMd = readTextFile(missionDir, "discoveries.md")
  const questionsMd = readTextFile(missionDir, "questions.md")
  const scripturesMd = readTextFile(missionDir, "scriptures.md")
  const bookOutlineMd = readTextFile(missionDir, "book-outline.md")
  const courseOutlineMd = readTextFile(missionDir, "course-outline.md")
  const youtubeSeriesMd = readTextFile(missionDir, "youtube-series.md")

  const missionTitle = parseMissionTitle(missionMd, slug)
  const discoveryLines = extractLines(discoveriesMd)
  const questionLines = parseQuestionLines(questionsMd)
  const scriptureRefs = parseScriptureRefs(scripturesMd)
  const bookOutlineLines = extractLines(bookOutlineMd)
  const courseOutlineLines = extractLines(courseOutlineMd)
  const youtubeLines = extractLines(youtubeSeriesMd)
  const themes = parseThemes(scripturesMd)

  const sermonSeries = fallbackItems(
    bookOutlineLines.slice(0, 6).map((line) => `Sermon: ${line}`),
    "Sermon: Womanhood Foundations"
  )
  const bibleStudies = fallbackItems(
    scriptureRefs.slice(0, 8).map((ref) => `Bible Study on ${ref}`),
    "Bible Study on Isaiah 49:15"
  )
  const teachingCourses = fallbackItems(
    courseOutlineLines.slice(0, 6).map((line) => `Course Module: ${line}`),
    "Course Module: Biblical Womanhood Essentials"
  )
  const smallGroupResources = fallbackItems(
    questionLines.slice(0, 8).map((q) => `Group Discussion: ${q}`),
    "Group Discussion: How does Scripture describe womanhood?"
  )
  const scriptureCollections = fallbackItems(scriptureRefs.slice(0, 16), "Isaiah 49:15")
  const prayerThemes = fallbackItems(themes.slice(0, 8).map((t) => `Pray for ${t}`), "Pray for wisdom and nurture")
  const pastoralApplications = fallbackItems(
    discoveryLines.slice(0, 8).map((d) => `Pastoral application: ${d}`),
    "Pastoral application: Build a mentorship path for women"
  )
  const illustrations = fallbackItems(
    scriptureCollections.slice(0, 6).map((ref) => `Illustration from ${ref}`),
    "Illustration from Isaiah 49:15"
  )
  const kingdomPrinciples = fallbackItems(themes.slice(0, 10), "Faithfulness")
  const insights = fallbackItems(discoveryLines.slice(0, 10), "Research mission mapped for ministry teaching")

  const teachingCount = sermonSeries.length + bibleStudies.length + teachingCourses.length
  const scriptureCount = scriptureCollections.length
  const lessonCount = smallGroupResources.length

  const progressBase = 30 + teachingCount + lessonCount
  const progress = progressBase > 95 ? 95 : progressBase

  const confidence: "low" | "moderate" | "high" | "very-high" =
    scriptureCount > 20 ? "very-high" : scriptureCount > 10 ? "high" : scriptureCount > 5 ? "moderate" : "low"

  const timeline: MinistryWorkspace["timeline"] = [
    { date: "2026-07-02", event: "Research mission captured", status: "completed" },
    { date: "2026-07-03", event: "Scripture and discovery synthesis", status: "completed" },
    { date: "2026-07-04", event: "Teaching resources drafted", status: "in-progress" },
    { date: "2026-07-05", event: "Ministry workspace preview prepared", status: "planned" },
  ]

  return {
    id: slug,
    name: "Ministry Workspace",
    relatedResearchMission: missionTitle,
    progress,
    confidence,
    status: "active",
    suggestedNextTeaching: sermonSeries[0],
    teachingCount,
    scriptureCount,
    lessonCount,
    themes,
    insights,
    crossReferences: scriptureCollections,
    timeline,
    sermonSeries,
    bibleStudies,
    teachingCourses,
    smallGroupResources,
    scriptureCollections,
    prayerThemes,
    pastoralApplications,
    illustrations,
    kingdomPrinciples,
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
