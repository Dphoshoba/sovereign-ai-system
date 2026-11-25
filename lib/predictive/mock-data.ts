import type { PredictiveRoadmapItem } from "./types"

export function buildPredictiveRoadmap(slug: string): PredictiveRoadmapItem[] {
  return [
    { date: "2026-07-05", event: `${slug} trend analysis completed`, status: "completed" },
    { date: "2026-07-06", event: `${slug} forecasts generated`, status: "completed" },
    { date: "2026-07-07", event: `${slug} predictive models updated`, status: "planned" },
  ]
}
