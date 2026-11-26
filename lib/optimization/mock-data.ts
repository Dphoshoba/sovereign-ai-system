import type { OptimizationRoadmapItem } from "./types"

export function buildOptimizationRoadmap(slug: string): OptimizationRoadmapItem[] {
  return [
    { date: "2026-Q3", event: "Identify optimization opportunities", status: "completed" },
    { date: "2026-Q4", event: "Implement efficiency gains", status: "in-progress" },
    { date: "2027-Q1", event: "Measure cost reduction impact", status: "planned" },
  ]
}
