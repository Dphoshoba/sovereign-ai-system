import type { OpportunityRoadmapItem } from "./types"

export function buildOpportunityRoadmap(slug: string): OpportunityRoadmapItem[] {
  return [
    { date: "2026-07-05", event: `${slug} opportunity lanes consolidated`, status: "completed" },
    { date: "2026-07-06", event: `${slug} ROI opportunity ranking generated`, status: "completed" },
    { date: "2026-07-07", event: `${slug} opportunity execution queue planned`, status: "planned" },
  ]
}
