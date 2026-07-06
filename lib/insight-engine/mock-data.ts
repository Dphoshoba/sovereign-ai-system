import type { InsightRoadmapItem } from "./types"

export const INSIGHT_SECTIONS = {
  trends: "Trends",
  themes: "Emerging Themes",
  signals: "Cross-Domain Signals",
  recommendations: "Recommendations",
} as const

export function buildInsightRoadmap(slug: string): InsightRoadmapItem[] {
  return [
    { date: "2026-07-05", event: `${slug} trend surface normalized`, status: "completed" },
    { date: "2026-07-06", event: `${slug} signal map aligned across domains`, status: "completed" },
    { date: "2026-07-07", event: `${slug} insight board staged for weekly review`, status: "planned" },
  ]
}
