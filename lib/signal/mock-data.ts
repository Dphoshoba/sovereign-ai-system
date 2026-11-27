import type { SignalRoadmapItem } from "./types"

export function buildSignalRoadmap(slug: string): SignalRoadmapItem[] {
  return [
    { date: "2026-Q3", event: "Establish signal baselines", status: "completed" },
    { date: "2026-Q4", event: "Monitor trend emergence", status: "in-progress" },
    { date: "2027-Q1", event: "Trigger on anomalies", status: "planned" },
  ]
}
