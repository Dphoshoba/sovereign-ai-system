import { ACADEMY_ASSETS } from "../academy/mock-data"
import type { AcademyWorkspace } from "../academy/types"
import { getResearchMissions } from "./research-registry"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export async function getMissionAcademyWorkspace(slug: string): Promise<AcademyWorkspace | null> {
  const missions = await getResearchMissions()
  const mission = missions.find((item) => item.slug === slug)
  if (!mission) {
    return null
  }

  const courseCount = ACADEMY_ASSETS.find((item) => item.name === "Courses")?.count ?? 0
  const bookCount = ACADEMY_ASSETS.find((item) => item.name === "Books")?.count ?? 0
  const seriesCount = ACADEMY_ASSETS.find((item) => item.name === "Teaching Series")?.count ?? 0
  const seminarCount = ACADEMY_ASSETS.find((item) => item.name === "Seminars")?.count ?? 0
  const frameworkCount = ACADEMY_ASSETS.find((item) => item.name === "Frameworks")?.count ?? 0

  const totalAssets = ACADEMY_ASSETS.reduce((sum, item) => sum + item.count, 0)
  const academyScore = clamp(Math.floor(totalAssets * 2), 0, 100)
  const knowledgeReuse = clamp(Math.floor((frameworkCount * 8 + seriesCount * 6) / 2), 0, 100)
  const commercializationScore = clamp(Math.floor((courseCount * 8 + bookCount * 7 + seminarCount * 6) / 2), 0, 100)
  const healthScore = clamp(Math.floor((academyScore + knowledgeReuse + commercializationScore) / 3), 0, 100)

  return {
    mission: slug,
    missionTitle: mission.title,
    courseCount,
    bookCount,
    seriesCount,
    seminarCount,
    frameworkCount,
    academyScore,
    knowledgeReuse,
    commercializationScore,
    healthScore,
    assets: [...ACADEMY_ASSETS],
    recommendations: [
      "Align academy assets with mission template contracts.",
      "Increase framework-to-course conversion for higher reuse.",
      "Maintain deterministic SSR academy catalog rendering.",
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

export async function getAcademyRegistry(): Promise<{
  missionCount: number
  courseCount: number
  bookCount: number
  seriesCount: number
  seminarCount: number
  frameworkCount: number
  academyScore: number
  knowledgeReuse: number
  commercializationScore: number
  healthScore: number
  missions: AcademyWorkspace[]
}> {
  const missions = await getResearchMissions()
  const results: AcademyWorkspace[] = []

  for (const mission of missions) {
    const workspace = await getMissionAcademyWorkspace(mission.slug)
    if (workspace) {
      results.push(workspace)
    }
  }

  const missionCount = results.length
  const courseCount = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.courseCount, 0) / missionCount) : 0
  const bookCount = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.bookCount, 0) / missionCount) : 0
  const seriesCount = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.seriesCount, 0) / missionCount) : 0
  const seminarCount = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.seminarCount, 0) / missionCount) : 0
  const frameworkCount = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.frameworkCount, 0) / missionCount) : 0
  const academyScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.academyScore, 0) / missionCount) : 0
  const knowledgeReuse = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.knowledgeReuse, 0) / missionCount) : 0
  const commercializationScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.commercializationScore, 0) / missionCount) : 0
  const healthScore = missionCount > 0 ? Math.floor(results.reduce((sum, item) => sum + item.healthScore, 0) / missionCount) : 0

  return {
    missionCount,
    courseCount,
    bookCount,
    seriesCount,
    seminarCount,
    frameworkCount,
    academyScore,
    knowledgeReuse,
    commercializationScore,
    healthScore,
    missions: results,
  }
}