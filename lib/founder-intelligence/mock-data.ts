import type { FounderRoadmapItem } from "./types"

export function buildFounderRoadmap(slug: string): FounderRoadmapItem[] {
  return [
    { date: "2026-07-05", event: `${slug} founder focus mapped`, status: "completed" },
    { date: "2026-07-06", event: `${slug} clarity assessment completed`, status: "completed" },
    { date: "2026-07-07", event: `${slug} leadership trajectory planned`, status: "planned" },
  ]
}
