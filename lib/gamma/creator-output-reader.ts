import { existsSync, readFileSync } from "fs"
import { join, resolve, sep } from "path"
import type { CreatorWorkspace } from "../creator-workspace/types"

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

function extractListItems(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("#"))
    .filter((line) => line !== "---")
    .filter((line) => !/^(Title|Knowledge Domain|Category|Status|Phase|Confidence|Owner|Primary Workspace|Related Workspaces|Created):/i.test(line))
}

function readBookOutline(missionDir: string): string[] {
  const lines = extractListItems(readTextFile(missionDir, "book-outline.md"))
  return lines.length > 0 ? lines : ["Book outline not yet drafted"]
}

function readCourseOutline(missionDir: string): string[] {
  const lines = extractListItems(readTextFile(missionDir, "course-outline.md"))
  return lines.length > 0 ? lines : ["Course outline not yet drafted"]
}

function readYouTubeSeries(missionDir: string): string[] {
  const lines = extractListItems(readTextFile(missionDir, "youtube-series.md"))
  return lines.length > 0 ? lines : ["YouTube series not yet drafted"]
}

function readArticleIdeas(missionDir: string): string[] {
  const lines = extractListItems(readTextFile(missionDir, "articles.md"))
  return lines.length > 0 ? lines : ["Article ideas not yet drafted"]
}

export async function getCreatorWorkspace(slug: string): Promise<CreatorWorkspace | null> {
  const missionDir = getMissionDirectory(slug)
  if (!missionDir) {
    return null
  }

  const bookOutlines = readBookOutline(missionDir)
  const courseOutlines = readCourseOutline(missionDir)
  const youtubeSeries = readYouTubeSeries(missionDir)
  const articleIdeas = readArticleIdeas(missionDir)

  return {
    id: slug,
    name: "Creator Workspace",
    relatedMissionId: slug,
    relatedMissionName: "Research Mission 001 — Womanhood",
    progress: 48,
    confidence: "high",
    nextSuggestedOutput: "book-outline",
    contentStatus: "Preview ready",
    creatorProjects: [
      {
        id: "book-outline",
        title: "Book Outline",
        summary: bookOutlines[0],
        status: "ready",
        itemCount: bookOutlines.length,
      },
      {
        id: "course-outline",
        title: "Course Outline",
        summary: courseOutlines[0],
        status: "draft",
        itemCount: courseOutlines.length,
      },
      {
        id: "youtube-series",
        title: "YouTube Series",
        summary: youtubeSeries[0],
        status: "draft",
        itemCount: youtubeSeries.length,
      },
      {
        id: "article-ideas",
        title: "Article Ideas",
        summary: articleIdeas[0],
        status: "in-progress",
        itemCount: articleIdeas.length,
      },
    ],
    bookOutlines,
    courseOutlines,
    youtubeSeries,
    articleIdeas,
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
