import type { CEORoadmapItem } from "./types"

export function buildCEORoadmap(slug: string): CEORoadmapItem[] {
  return [
    { date: "2026-07-05", event: `${slug} strategic synthesis complete`, status: "completed" },
    { date: "2026-07-06", event: `${slug} executive dashboards aggregated`, status: "completed" },
    { date: "2026-07-07", event: `${slug} growth vectors prioritized`, status: "planned" },
  ]
}
