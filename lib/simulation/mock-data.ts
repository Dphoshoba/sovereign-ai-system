import type { SimulationRoadmapItem } from "./types"

export function buildSimulationRoadmap(slug: string): SimulationRoadmapItem[] {
  return [
    { date: "2026-Q3", event: "Define decision models", status: "completed" },
    { date: "2026-Q4", event: "Run test simulations", status: "in-progress" },
    { date: "2027-Q1", event: "Validate execution paths", status: "planned" },
  ]
}
