import type { AgentRoadmapItem } from "./types"

export function buildAgentRoadmap(slug: string): AgentRoadmapItem[] {
  return [
    { date: "2026-07-05", event: `${slug} agent capabilities indexed`, status: "completed" },
    { date: "2026-07-06", event: `${slug} agent coordination mapped`, status: "completed" },
    { date: "2026-07-07", event: `${slug} agent deployment ready`, status: "planned" },
  ]
}
