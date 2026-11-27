import type { LearningRoadmapItem } from "./types"

export function buildLearningRoadmap(slug: string): LearningRoadmapItem[] {
  return [
    { date: "2026-Q3", event: "Catalog learning assets", status: "completed" },
    { date: "2026-Q4", event: "Measure knowledge retention", status: "in-progress" },
    { date: "2027-Q1", event: "Optimize learning paths", status: "planned" },
  ]
}
