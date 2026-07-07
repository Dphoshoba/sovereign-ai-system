import type { EcosystemRoadmapItem } from "./types"

export function buildEcosystemRoadmap(slug: string): EcosystemRoadmapItem[] {
  return [
    { date: "2026-07-05", event: `${slug} ecosystem partnerships mapped`, status: "completed" },
    { date: "2026-07-06", event: `${slug} network connectivity optimized`, status: "completed" },
    { date: "2026-07-07", event: `${slug} ecosystem synergies activated`, status: "planned" },
  ]
}
