import type { ScenarioRoadmapItem } from "./types"

export function buildScenarioRoadmap(slug: string): ScenarioRoadmapItem[] {
  return [
    { date: "2026-Q3", event: "Identify scenario variables", status: "completed" },
    { date: "2026-Q4", event: "Model best/worst cases", status: "in-progress" },
    { date: "2027-Q1", event: "Plan contingencies", status: "planned" },
  ]
}
