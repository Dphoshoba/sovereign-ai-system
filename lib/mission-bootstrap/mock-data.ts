import type { MissionBootstrapRoadmapItem, MissionBootstrapTemplate } from "./types"

export const MISSION_BOOTSTRAP_TEMPLATES: ReadonlyArray<MissionBootstrapTemplate> = [
  { slug: "womanhood", name: "Womanhood", workspaceCount: 8, generatedAssets: 18, reuseScore: 82 },
  { slug: "fatherhood", name: "Fatherhood", workspaceCount: 8, generatedAssets: 16, reuseScore: 78 },
  { slug: "leadership", name: "Leadership", workspaceCount: 8, generatedAssets: 17, reuseScore: 80 },
  { slug: "discipleship", name: "Discipleship", workspaceCount: 8, generatedAssets: 18, reuseScore: 84 },
  { slug: "marriage", name: "Marriage", workspaceCount: 8, generatedAssets: 16, reuseScore: 77 },
  { slug: "business", name: "Business", workspaceCount: 8, generatedAssets: 19, reuseScore: 85 },
  { slug: "kingdom", name: "Kingdom", workspaceCount: 8, generatedAssets: 20, reuseScore: 86 },
  { slug: "ai", name: "AI", workspaceCount: 8, generatedAssets: 15, reuseScore: 74 },
  { slug: "history", name: "History", workspaceCount: 8, generatedAssets: 14, reuseScore: 72 },
  { slug: "health", name: "Health", workspaceCount: 8, generatedAssets: 14, reuseScore: 73 },
]

export function buildMissionBootstrapRoadmap(slug: string): MissionBootstrapRoadmapItem[] {
  return [
    { date: "2026-07-08", event: `${slug} mission bootstrap templates standardized`, status: "completed" },
    { date: "2026-07-09", event: `${slug} workspace duplication checks finalized`, status: "in-progress" },
    { date: "2026-07-10", event: `${slug} bootstrap freeze readiness`, status: "planned" },
  ]
}