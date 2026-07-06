import type { CapitalRoadmapItem } from "./types"

export function buildCapitalRoadmap(slug: string): CapitalRoadmapItem[] {
  return [
    { date: "2026-07-05", event: `${slug} capital inventory baseline completed`, status: "completed" },
    { date: "2026-07-06", event: `${slug} capitalization scoring aligned`, status: "completed" },
    { date: "2026-07-07", event: `${slug} licensing and content track planned`, status: "planned" },
  ]
}
