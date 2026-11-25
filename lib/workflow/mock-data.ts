import type { WorkflowRoadmapItem } from "./types"

export function buildWorkflowRoadmap(slug: string): WorkflowRoadmapItem[] {
  return [
    { date: "2026-07-05", event: `${slug} workflow chains designed`, status: "completed" },
    { date: "2026-07-06", event: `${slug} automation rules configured`, status: "completed" },
    { date: "2026-07-07", event: `${slug} workflow execution staged`, status: "planned" },
  ]
}
