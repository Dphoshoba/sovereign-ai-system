import type { AutonomyRoadmapItem } from "./types"

export function buildAutonomyRoadmap(slug: string): AutonomyRoadmapItem[] {
  return [
    { date: "2026-Q3", event: "Map automation opportunities", status: "completed" },
    { date: "2026-Q4", event: "Implement autonomous decisions", status: "in-progress" },
    { date: "2027-Q1", event: "Evaluate execution results", status: "planned" },
  ]
}
