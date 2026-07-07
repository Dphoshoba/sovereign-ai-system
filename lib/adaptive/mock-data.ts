import type { AdaptiveRoadmapItem } from "./types"

export function buildAdaptiveRoadmap(slug: string): AdaptiveRoadmapItem[] {
  return [
    { date: "2026-Q3", event: "Monitor change signals", status: "completed" },
    { date: "2026-Q4", event: "Apply adaptive patterns", status: "in-progress" },
    { date: "2027-Q1", event: "Evaluate system improvements", status: "planned" },
  ]
}
