import type { AdvisorRoadmapItem, MissionAdvisorWorkspace } from "./types"

export const ADVISOR_SECTION_TITLES = {
  priorities: "Today's Priorities",
  actions: "Top Actions",
  debt: "Knowledge Debt",
  roi: "Highest ROI Opportunities",
  weakest: "Weakest Areas",
  creator: "Creator Suggestions",
  teaching: "Teaching Suggestions",
  executive: "Executive Suggestions",
  agency: "Agency Suggestions",
  focus: "Mission Focus",
  roadmap: "Roadmap",
} as const

export function buildAdvisorRoadmap(slug: string): AdvisorRoadmapItem[] {
  return [
    { date: "2026-07-03", event: `${slug} discoveries converted into first workspace outputs`, status: "completed" },
    { date: "2026-07-04", event: `${slug} knowledge gaps identified`, status: "completed" },
    { date: "2026-07-05", event: `${slug} mission maturity snapshot prepared`, status: "completed" },
    { date: "2026-07-06", event: `${slug} daily advisor priorities generated`, status: "planned" },
  ]
}

export function countPriorityActions(actions: MissionAdvisorWorkspace["priorityActions"]): number {
  return actions.filter((action) => action.priority === "high").length
}