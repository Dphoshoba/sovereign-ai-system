import type { MissionControlRoadmapItem } from "./types"

export const MISSION_CONTROL_SECTIONS = {
  missionStatus: "Mission Status",
  executiveView: "Executive View",
  advisorInsights: "Advisor Insights",
  executionRadar: "Execution Radar",
  plannerQueue: "Planner Queue",
  reviewSnapshot: "Review Snapshot",
  knowledgeDebt: "Knowledge Debt",
  risks: "Risks",
  opportunities: "Opportunities",
  recommendations: "Recommendations",
  immediateActions: "Immediate Actions",
  nextSevenDays: "Next 7 Days",
  missionOutlook: "Mission Outlook",
} as const

export function buildMissionControlRoadmap(slug: string): MissionControlRoadmapItem[] {
  return [
    { date: "2026-07-04", event: `${slug} advisor-planner-review loop synchronized`, status: "completed" },
    { date: "2026-07-05", event: `${slug} executive and intelligence signals unified`, status: "completed" },
    { date: "2026-07-06", event: `${slug} mission control command surface generated`, status: "planned" },
  ]
}