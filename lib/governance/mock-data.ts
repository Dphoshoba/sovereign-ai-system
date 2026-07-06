import type { GovernanceRoadmapItem } from "./types"

export function buildGovernanceRoadmap(slug: string): GovernanceRoadmapItem[] {
  return [
    { date: "2026-07-05", event: `${slug} deterministic policy checks baselined`, status: "completed" },
    { date: "2026-07-06", event: `${slug} SSR and hydration safety checks aligned`, status: "completed" },
    { date: "2026-07-07", event: `${slug} freeze readiness review planned`, status: "planned" },
  ]
}
