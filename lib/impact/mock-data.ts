import type { ImpactRoadmapItem } from "./types"

export function buildImpactRoadmap(slug: string): ImpactRoadmapItem[] {
  return [
    { date: "2026-Q3", event: "Measure direct impact", status: "completed" },
    { date: "2026-Q4", event: "Assess societal value", status: "in-progress" },
    { date: "2027-Q1", event: "Build legacy framework", status: "planned" },
  ]
}
