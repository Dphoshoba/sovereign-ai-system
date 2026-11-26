import type { EvolutionRoadmapItem } from "./types"

export function buildEvolutionRoadmap(slug: string): EvolutionRoadmapItem[] {
  return [
    { date: "2026-Q3", event: "Phase 1 foundations", status: "completed" },
    { date: "2026-Q4", event: "Phase 2 expansion", status: "in-progress" },
    { date: "2027-Q1", event: "Phase 3 acceleration", status: "planned" },
  ]
}
