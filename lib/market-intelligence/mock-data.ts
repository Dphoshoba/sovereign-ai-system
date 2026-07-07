import type { MarketRoadmapItem } from "./types"

export function buildMarketIntelligenceRoadmap(slug: string): MarketRoadmapItem[] {
  return [
    { date: "2026-Q3", event: "Analyze market segments", status: "completed" },
    { date: "2026-Q4", event: "Assess demand dynamics", status: "in-progress" },
    { date: "2027-Q1", event: "Identify adoption opportunities", status: "planned" },
  ]
}
