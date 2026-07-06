import type { GammaOsRoadmapItem } from "./types"

export function buildGammaOsRoadmap(slug: string): GammaOsRoadmapItem[] {
  return [
    { date: "2026-07-05", event: `${slug} operating system layers synchronized`, status: "completed" },
    { date: "2026-07-06", event: `${slug} intelligence surfaces aligned`, status: "completed" },
    { date: "2026-07-07", event: `${slug} freeze readiness staged`, status: "planned" },
  ]
}
