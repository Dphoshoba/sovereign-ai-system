import type { ExecutiveDashboardRoadmapItem } from "./types"

export const EXECUTIVE_DASHBOARD_SECTIONS = {
  executiveSummary: "Executive Summary",
  strategicAlignment: "Strategic Alignment",
  missionRisk: "Mission Risk",
  opportunities: "Opportunities",
  decisionQueue: "Decision Queue",
  priorityRadar: "Priority Radar",
  knowledgeVelocity: "Knowledge Velocity",
  growthTrajectory: "Growth Trajectory",
  sustainability: "Sustainability",
  nextMoves: "Next Executive Moves",
} as const

export function buildExecutiveDashboardRoadmap(slug: string): ExecutiveDashboardRoadmapItem[] {
  return [
    { date: "2026-07-04", event: `${slug} strategic baseline established`, status: "completed" },
    { date: "2026-07-05", event: `${slug} mission risk and opportunity signals refreshed`, status: "completed" },
    { date: "2026-07-06", event: `${slug} executive dashboard snapshot generated`, status: "planned" },
  ]
}