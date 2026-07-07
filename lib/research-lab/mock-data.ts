import type { ResearchRoadmapItem } from "./types"

export function buildResearchLabRoadmap(slug: string): ResearchRoadmapItem[] {
  return [
    { date: "2026-Q3", event: "Initiate research projects", status: "completed" },
    { date: "2026-Q4", event: "Generate discoveries", status: "in-progress" },
    { date: "2027-Q1", event: "Publish frameworks", status: "planned" },
  ]
}
