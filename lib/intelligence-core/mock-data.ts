import type { IntelligenceCoreRoadmapItem } from "./types"

export function buildIntelligenceCoreRoadmap(slug: string): IntelligenceCoreRoadmapItem[] {
  return [
    { date: "2026-Q3", event: "Integrate core systems", status: "completed" },
    { date: "2026-Q4", event: "Activate adaptive intelligence", status: "in-progress" },
    { date: "2027-Q1", event: "Optimize learning loops", status: "planned" },
  ]
}
