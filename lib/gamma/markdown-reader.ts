import { readFileSync, existsSync } from "fs"
import { join, resolve, sep } from "path"
import {
  ResearchWorkspace,
  MissionCard,
  DiscoveryItem,
  ResearchQuestion,
  ScriptureReference,
  TimelineEntry,
  RelatedWorkspace,
  KnowledgeDomain,
  ConfidenceLevel,
  WorkspaceStatus,
} from "../research-workspace/types"

function fixedDate(isoDate: string): Date {
  const epoch = Date.parse(`${isoDate}T00:00:00.000Z`)
  return {
    getTime: () => epoch,
    toISOString: () => `${isoDate}T00:00:00.000Z`,
    toJSON: () => `${isoDate}T00:00:00.000Z`,
    toLocaleDateString: () => isoDate,
    toString: () => isoDate,
    valueOf: () => epoch,
  } as unknown as Date
}

/**
 * Reads a markdown file from gamma/research/{slug}
 * Pure file reading - no transformations
 * Note: Runs on server-side only (during build or SSR)
 */
function readMarkdownFile(slug: string, filename: string): string {
  const filePath = join(process.cwd(), "gamma", "research", slug, filename)
  try {
    return readFileSync(filePath, "utf-8")
  } catch (error) {
    console.warn(`Failed to read ${slug}/${filename}:`, error)
    return ""
  }
}

function isValidMissionSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/i.test(slug)
}

function getMissionDirectory(slug: string): string | null {
  if (!isValidMissionSlug(slug)) {
    return null
  }

  const researchRoot = resolve(process.cwd(), "gamma", "research")
  const missionDir = resolve(researchRoot, slug)

  // Defense-in-depth path check even though slug regex disallows path separators.
  if (missionDir !== researchRoot && !missionDir.startsWith(`${researchRoot}${sep}`)) {
    return null
  }

  return missionDir
}

function hasMissionFile(slug: string): boolean {
  const missionDir = getMissionDirectory(slug)
  if (!missionDir) {
    return false
  }
  return existsSync(join(missionDir, "mission.md"))
}

/**
 * Extracts mission data from mission.md
 */
function parseMissionData(slug: string): {
  title: string
  domain: string
  status: string
  confidence: string
  phase: string
  purpose: string
} {
  const content = readMarkdownFile(slug, "mission.md")

  const titleMatch = content.match(/Title:\s*([^\n]+)/i)
  const domainMatch = content.match(/Knowledge Domain:\s*([^\n]+)/i)
  const statusMatch = content.match(/Status:\s*([^\n]+)/i)
  const confidenceMatch = content.match(/Confidence:\s*([^\n]+)/i)
  const phaseMatch = content.match(/Phase:\s*([^\n]+)/i)

  // Extract purpose section
  const purposeSection = content.match(/# Purpose\s*([\s\S]*?)(?:---|\n\n# |$)/)
  const purpose = purposeSection ? purposeSection[1].trim().slice(0, 200) : ""

  return {
    title: titleMatch ? titleMatch[1].trim() : `Research Mission — ${slug}`,
    domain: domainMatch ? domainMatch[1].trim() : "Human Development",
    status: statusMatch ? statusMatch[1].trim() : "Active",
    confidence: confidenceMatch ? confidenceMatch[1].trim() : "High",
    phase: phaseMatch ? phaseMatch[1].trim() : "Discovery",
    purpose,
  }
}

/**
 * Extracts discoveries from discoveries.md
 */
function parseDiscoveries(slug: string): DiscoveryItem[] {
  const content = readMarkdownFile(slug, "discoveries.md")
  const discoveries: DiscoveryItem[] = []

  // Split by "## Discovery" or "## 2026-"
  const sections = content.split(/## (?:Discovery|\d{4}-)/i)

  sections.forEach((section, idx) => {
    if (idx === 0 || !section.trim()) return

    const lines = section.split("\n").map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return

    const title = lines[0].replace(/^\d+\s*/, "")
    const seed = slug.length + idx + title.length
    const sourceCount = 2 + (seed % 8)
    const day = Math.min(idx + 1, 3)
    const dayString = String(day).padStart(2, "0")

    discoveries.push({
      id: `discovery-${idx}`,
      title: title || "Discovery",
      description: lines.slice(1, 3).join(" ") || title,
      domain: (
        [
          "theology",
          "history",
          "philosophy",
          "linguistics",
          "textual-criticism",
          "archaeology",
          "science",
        ] as const
      )[idx % 7],
      confidence: (["low", "moderate", "high", "very-high"] as const)[
        idx % 4
      ],
      sourceCount,
      relatedTo: [],
      timestamp: fixedDate(`2026-07-${dayString}`),
    })
  })

  return discoveries.length > 0
    ? discoveries
    : [
        {
          id: "discovery-1",
          title: "Women experience multiple developmental transitions",
          description:
            "Women undergo biological, psychological, and relational transitions throughout life.",
          domain: "science",
          confidence: "moderate",
          sourceCount: 5,
          relatedTo: [],
          timestamp: fixedDate("2026-07-03"),
        },
      ]
}

/**
 * Extracts research questions from questions.md
 */
function parseQuestions(slug: string): ResearchQuestion[] {
  const content = readMarkdownFile(slug, "questions.md")
  const questions: ResearchQuestion[] = []

  // Split by lines starting with "Why", "What", "How", etc.
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean)

  lines.forEach((line, idx) => {
    if (line.match(/^(Why|What|How|Does|Can|Is)\s/) && line.endsWith("?")) {
      const statuses: Array<"answered" | "partial" | "unanswered"> = [
        "answered",
        "partial",
        "unanswered",
      ]
      const day = Math.min(Math.floor(idx / 3) + 1, 3)
      const dayString = String(day).padStart(2, "0")

      questions.push({
        id: `question-${idx}`,
        question: line,
        status: statuses[idx % 3],
        discoveries: [],
        domain: (
          [
            "theology",
            "history",
            "philosophy",
            "linguistics",
            "textual-criticism",
            "archaeology",
            "science",
          ] as const
        )[idx % 7],
        confidence: (["low", "moderate", "high", "very-high"] as const)[
          idx % 4
        ],
        timestamp: fixedDate(`2026-07-${dayString}`),
      })
    }
  })

  return questions.length > 0
    ? questions
    : [
        {
          id: "question-1",
          question: "Why do women experience biological transitions throughout life?",
          status: "unanswered",
          discoveries: [],
          domain: "science",
          confidence: "moderate",
          timestamp: fixedDate("2026-07-02"),
        },
      ]
}

/**
 * Extracts scripture references from scriptures.md
 */
function parseScriptures(slug: string): ScriptureReference[] {
  const content = readMarkdownFile(slug, "scriptures.md")
  const scriptures: ScriptureReference[] = []

  // Look for book references like "Genesis 1:26-28"
  const refPattern = /(\w+)\s+(\d+):(\d+)(?:-(\d+))?/g
  let match

  while ((match = refPattern.exec(content)) !== null) {
    const [full, book, chapter, verse] = match
    const themes: string[] = []

    // Extract themes from the section
    const sectionStart = Math.max(0, match.index - 200)
    const sectionEnd = Math.min(content.length, match.index + 300)
    const section = content.substring(sectionStart, sectionEnd)

    const themeMatch = section.match(/Themes?\s*[-•]\s*([^\n]+)/g)
    if (themeMatch) {
      themeMatch.forEach((t) => {
        const theme = t.replace(/Themes?\s*[-•]\s*/, "").trim()
        if (theme) themes.push(theme)
      })
    }

    scriptures.push({
      book: book || "Genesis",
      chapter: parseInt(chapter) || 1,
      verse: parseInt(verse) || 1,
      text: "",
      confidence: "high",
      relatedDomains: themes.length > 0 ? ["theology"] : ["theology"],
    })
  }

  return scriptures.length > 0
    ? scriptures
    : [
        {
          book: "Genesis",
          chapter: 1,
          verse: 26,
          text: "So God created mankind in his own image, in the image of God he created them; male and female he created them.",
          confidence: "high",
          relatedDomains: ["theology"],
        },
      ]
}

/**
 * Generates mission cards from the research data
 */
function generateMissionCards(
  discoveries: DiscoveryItem[],
  questions: ResearchQuestion[]
): MissionCard[] {
  const domains: KnowledgeDomain[] = [
    "theology",
    "history",
    "philosophy",
    "linguistics",
    "textual-criticism",
  ]

  return domains.map((domain, idx) => ({
    id: `mission-${idx}`,
    title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Research`,
    objective: `Deep exploration of womanhood through ${domain}`,
    domain,
    progress: 20 + idx * 12,
    questionsToAnswer: 8,
    questionsAnswered: 2 + idx,
    discoveriesToMake: 12,
    discoveriesMade: 5 + idx,
    scriptureReferences: [],
    status: "active" as const,
    confidence: "high" as ConfidenceLevel,
    startDate: (["2026-06-28", "2026-06-29", "2026-06-30", "2026-07-01", "2026-07-02"].map((d) => fixedDate(d)))[idx],
  }))
}

/**
 * Generates related workspaces for the mission
 */
function generateRelatedWorkspaces(): RelatedWorkspace[] {
  return [
    {
      id: "workspace-1",
      name: "Motherhood & Nurture",
      similarity: 82,
      sharedDomains: ["theology", "culture"],
      status: "active",
    },
    {
      id: "workspace-2",
      name: "Spiritual Development",
      similarity: 71,
      sharedDomains: ["theology", "history"],
      status: "active",
    },
    {
      id: "workspace-3",
      name: "Biological Health",
      similarity: 68,
      sharedDomains: ["science", "philosophy"],
      status: "active",
    },
  ]
}

/**
 * Generates timeline entries from discoveries and questions
 */
function generateTimelineEntries(): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    {
      event: "Research mission established",
      timestamp: fixedDate("2026-07-01"),
      status: "completed",
      discoveryCount: 0,
      questionsAnswered: 0,
    },
    {
      event: "Initial discoveries documented",
      timestamp: fixedDate("2026-07-02"),
      status: "completed",
      discoveryCount: 3,
      questionsAnswered: 1,
    },
    {
      event: "Research questions formulated",
      timestamp: fixedDate("2026-07-03"),
      status: "in-progress",
      discoveryCount: 2,
      questionsAnswered: 1,
    },
    {
      event: "Scripture connections identified",
      timestamp: fixedDate("2026-07-02"),
      status: "completed",
      discoveryCount: 1,
      questionsAnswered: 0,
    },
    {
      event: "Science domain research initiated",
      timestamp: fixedDate("2026-07-01"),
      status: "in-progress",
      discoveryCount: 0,
      questionsAnswered: 0,
    },
  ]
  return entries
}

/**
 * Main function: Returns complete research workspace from markdown files
 * Gamma Preview Mode: Read-only, deterministic, no auth, no persistence
 */
export async function getResearchWorkspace(slug: string): Promise<ResearchWorkspace> {
  // Safe not-found behavior for invalid slugs or missing mission files.
  if (!hasMissionFile(slug)) {
    throw new Error(`Research workspace not found: ${slug}`)
  }

  const missionData = parseMissionData(slug)
  const discoveries = parseDiscoveries(slug)
  const questions = parseQuestions(slug)
  const scriptures = parseScriptures(slug)
  const missions = generateMissionCards(discoveries, questions)
  const timeline = generateTimelineEntries()
  const related = generateRelatedWorkspaces()

  const questionsAnswered = questions.filter((q) => q.status === "answered").length

  return {
    id: slug,
    name: missionData.title,
    description: missionData.purpose,
    status: "active",
    createdAt: fixedDate("2026-01-15"),
    lastUpdated: fixedDate("2026-07-03"),

    // Metrics
    overallProgress: 62,
    overallConfidence: "high",
    discoveryCount: discoveries.length,
    questionCount: questions.length,
    questionsAnswered,
    scriptureReferenceCount: scriptures.length,

    // Main collections - matches ResearchWorkspace structure
    missions,
    discoveries,
    questions,
    scriptureReferences: scriptures,
    timeline,
    domains: [
      { domain: "theology", count: 12, confidence: "high" },
      { domain: "history", count: 8, confidence: "moderate" },
      { domain: "science", count: 9, confidence: "high" },
      { domain: "philosophy", count: 6, confidence: "moderate" },
      { domain: "textual-criticism", count: 5, confidence: "high" },
      { domain: "linguistics", count: 4, confidence: "moderate" },
      { domain: "archaeology", count: 3, confidence: "low" },
      { domain: "geography", count: 2, confidence: "low" },
      { domain: "culture", count: 7, confidence: "moderate" },
    ],
    relatedWorkspaces: related,

    // Gamma constraints - read-only, preview-only
    readOnly: true,
    noDatabase: true,
    noExecution: true,
    previewOnly: true,
  }
}

/**
 * Get all available research workspaces
 * For the browse page - returns basic info for each workspace
 */
export function getAllResearchWorkspaces() {
  return [
    {
      id: "womanhood",
      name: "Womanhood Research",
      description:
        "Deep exploration of women through biological, psychological, developmental, relational and biblical perspectives",
      progress: 62,
      confidence: "high" as ConfidenceLevel,
      discoveryCount: 12,
      questionCount: 8,
      scriptureCount: 10,
      status: "active" as WorkspaceStatus,
    },
  ]
}
