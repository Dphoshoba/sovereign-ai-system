import type { PlannerRoadmapItem, PlannerTask } from "./types"

export const PLANNER_SECTION_TITLES = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  dependencies: "Dependencies",
  blockers: "Blockers",
  roadmap: "Roadmap",
  priorityQueue: "Priority Queue",
  executionPlan: "Execution Plan",
  missionSchedule: "Mission Schedule",
  recommendations: "Recommendations",
} as const

export function buildPlannerRoadmap(slug: string): PlannerRoadmapItem[] {
  return [
    { date: "2026-07-04", event: `${slug} advisor priorities generated`, status: "completed" },
    { date: "2026-07-05", event: `${slug} maturity and gap signals synchronized`, status: "completed" },
    { date: "2026-07-06", event: `${slug} execution sequence planned`, status: "planned" },
    { date: "2026-07-07", event: `${slug} delivery cadence reviewed`, status: "planned" },
  ]
}

export function byPriorityAndWindow(a: PlannerTask, b: PlannerTask): number {
  const weight = { high: 0, medium: 1, low: 2 }
  const windowWeight = { today: 0, week: 1, month: 2 }

  if (weight[a.priority] !== weight[b.priority]) {
    return weight[a.priority] - weight[b.priority]
  }

  if (windowWeight[a.window] !== windowWeight[b.window]) {
    return windowWeight[a.window] - windowWeight[b.window]
  }

  return a.title.localeCompare(b.title)
}