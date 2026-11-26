import type { IngestionPipelineStage, IngestionRoadmapItem } from "./types"

export function buildIngestionStages(): IngestionPipelineStage[] {
  return [
    { stage: "markdown", source: "gamma/research", output: "research registry", status: "healthy" },
    { stage: "research registry", source: "research registry", output: "relationships", status: "healthy" },
    { stage: "relationships", source: "knowledge-links", output: "knowledge graph", status: "healthy" },
    { stage: "knowledge graph", source: "graph reader", output: "inference", status: "healthy" },
    { stage: "inference", source: "inference reader", output: "advisor", status: "healthy" },
    { stage: "advisor", source: "advisor reader", output: "planner", status: "healthy" },
    { stage: "planner", source: "planner reader", output: "review", status: "healthy" },
    { stage: "review", source: "review reader", output: "mission control", status: "healthy" },
    { stage: "mission control", source: "mission-control reader", output: "gamma os", status: "ready" },
  ]
}

export function buildIngestionRoadmap(slug: string): IngestionRoadmapItem[] {
  return [
    { date: "2026-07-07", event: `${slug} ingestion contracts aligned`, status: "completed" },
    { date: "2026-07-08", event: `${slug} relationship and graph sync hardened`, status: "in-progress" },
    { date: "2026-07-09", event: `${slug} full knowledge automation freeze`, status: "planned" },
  ]
}