import type { InnovationRoadmapItem } from "./types"

export function buildInnovationRoadmap(slug: string): InnovationRoadmapItem[] {
  return [
    { date: "2026-Q3", event: "Generate new concepts", status: "completed" },
    { date: "2026-Q4", event: "Build prototypes", status: "in-progress" },
    { date: "2027-Q1", event: "Commercialize innovations", status: "planned" },
  ]
}
