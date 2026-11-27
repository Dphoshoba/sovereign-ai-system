import type { StrategyRoadmapItem } from "./types"

export function buildStrategyRoadmap(slug: string): StrategyRoadmapItem[] {
  return [
    { date: "2026-Q3", event: "Identify competitive advantages", status: "completed" },
    { date: "2026-Q4", event: "Develop strategic themes", status: "in-progress" },
    { date: "2027-Q1", event: "Execute strategic initiatives", status: "planned" },
  ]
}
