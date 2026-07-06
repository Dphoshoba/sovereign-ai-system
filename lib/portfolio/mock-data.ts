import type { PortfolioRoadmapItem } from "./types"

export function buildPortfolioRoadmap(slug: string): PortfolioRoadmapItem[] {
  return [
    { date: "2026-07-05", event: `${slug} portfolio inventory synchronized`, status: "completed" },
    { date: "2026-07-06", event: `${slug} workspace coverage scored`, status: "completed" },
    { date: "2026-07-07", event: `${slug} portfolio priorities staged`, status: "planned" },
  ]
}
