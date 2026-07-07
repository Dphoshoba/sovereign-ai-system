import type { ResourceRoadmapItem } from "./types"

export function buildResourceRoadmap(slug: string): ResourceRoadmapItem[] {
  return [
    { date: "2026-07-05", event: `${slug} resources inventoried`, status: "completed" },
    { date: "2026-07-06", event: `${slug} allocation optimized`, status: "completed" },
    { date: "2026-07-07", event: `${slug} utilization maximized`, status: "planned" },
  ]
}
