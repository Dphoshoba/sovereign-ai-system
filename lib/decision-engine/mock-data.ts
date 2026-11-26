import type { DecisionRoadmapItem } from "./types"

export function buildDecisionRoadmap(slug: string): DecisionRoadmapItem[] {
  return [
    { date: "2026-07-05", event: `${slug} decision matrix built`, status: "completed" },
    { date: "2026-07-06", event: `${slug} decision quality assessed`, status: "completed" },
    { date: "2026-07-07", event: `${slug} decision execution planned`, status: "planned" },
  ]
}
