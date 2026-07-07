import type { SynthesisRoadmapItem } from "./types"

export function buildSynthesisRoadmap(slug: string): SynthesisRoadmapItem[] {
  return [
    { date: "2026-Q3", event: "Identify cross-domain links", status: "completed" },
    { date: "2026-Q4", event: "Synthesize knowledge", status: "in-progress" },
    { date: "2027-Q1", event: "Increase reusability", status: "planned" },
  ]
}
