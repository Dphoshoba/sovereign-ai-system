import type { MonetizationRoadmapItem } from "./types"

export function buildMonetizationRoadmap(slug: string): MonetizationRoadmapItem[] {
  return [
    { date: "2026-07-05", event: `${slug} revenue streams identified`, status: "completed" },
    { date: "2026-07-06", event: `${slug} pricing models validated`, status: "completed" },
    { date: "2026-07-07", event: `${slug} commercialization launched`, status: "planned" },
  ]
}
