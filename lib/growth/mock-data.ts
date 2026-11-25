import type { GrowthRoadmapItem } from "./types"

export function buildGrowthRoadmap(slug: string): GrowthRoadmapItem[] {
  return [
    { date: "2026-07-05", event: `${slug} growth vectors identified`, status: "completed" },
    { date: "2026-07-06", event: `${slug} expansion opportunities ranked`, status: "completed" },
    { date: "2026-07-07", event: `${slug} growth acceleration triggered`, status: "planned" },
  ]
}
