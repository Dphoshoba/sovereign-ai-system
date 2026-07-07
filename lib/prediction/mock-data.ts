import type { PredictionRoadmapItem } from "./types"

export function buildPredictionRoadmap(slug: string): PredictionRoadmapItem[] {
  return [
    { date: "2026-Q3", event: "Gather forecast data", status: "completed" },
    { date: "2026-Q4", event: "Build predictive models", status: "in-progress" },
    { date: "2027-Q1", event: "Validate predictions", status: "planned" },
  ]
}
