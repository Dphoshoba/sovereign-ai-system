import type { MissionMaturityLevel, MaturityTimelineItem } from "./types"

export const MISSION_MATURITY_LEVELS: MissionMaturityLevel[] = [
  "Seed",
  "Growing",
  "Developing",
  "Mature",
  "Advanced",
  "Production Ready",
  "Operational",
]

export const MATURITY_SECTION_TITLES = {
  missionMaturity: "Mission Maturity",
  workspaceRankings: "Workspace Rankings",
  weakestAreas: "Weakest Areas",
  highestPerformingAssets: "Highest Performing Assets",
  reusePotential: "Reuse Potential",
  commercialPotential: "Commercial Potential",
  teachingPotential: "Teaching Potential",
  readinessTimeline: "Readiness Timeline",
  missionEvolution: "Mission Evolution",
} as const

export function classifyMissionMaturity(score: number, healthScore: number, readinessScore: number): MissionMaturityLevel {
  if (score === 100 && healthScore >= 95 && readinessScore >= 95) {
    return "Operational"
  }
  if (score <= 20) {
    return "Seed"
  }
  if (score <= 40) {
    return "Growing"
  }
  if (score <= 60) {
    return "Developing"
  }
  if (score <= 75) {
    return "Mature"
  }
  if (score <= 90) {
    return "Advanced"
  }
  return "Production Ready"
}

export function buildReadinessTimeline(slug: string): MaturityTimelineItem[] {
  return [
    { date: "2026-07-02", event: `${slug} research registry anchored`, status: "completed" },
    { date: "2026-07-03", event: `${slug} creator and ministry outputs connected`, status: "completed" },
    { date: "2026-07-04", event: `${slug} executive and agency layers summarized`, status: "completed" },
    { date: "2026-07-05", event: `${slug} reusable knowledge promoted`, status: "completed" },
    { date: "2026-07-06", event: `${slug} maturity snapshot generated`, status: "planned" },
  ]
}