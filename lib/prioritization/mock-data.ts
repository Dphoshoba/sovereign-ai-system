import type { PrioritizationRoadmapItem } from "./types"

export function buildPrioritizationRoadmap(slug: string): PrioritizationRoadmapItem[] {
  return [
    { date: "2026-07-05", event: `${slug} impact-effort matrix built`, status: "completed" },
    { date: "2026-07-06", event: `${slug} priority ranking calculated`, status: "completed" },
    { date: "2026-07-07", event: `${slug} focus allocation planned`, status: "planned" },
  ]
}
