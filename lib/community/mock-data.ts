import type { CommunityRoadmapItem } from "./types"

export function buildCommunityRoadmap(slug: string): CommunityRoadmapItem[] {
  return [
    { date: "2026-Q3", event: "Build community foundations", status: "completed" },
    { date: "2026-Q4", event: "Increase engagement", status: "in-progress" },
    { date: "2027-Q1", event: "Expand network growth", status: "planned" },
  ]
}
