import { MissionMissionEconomyWorkspace } from "./types"

export const missionEconomyMockData: MissionMissionEconomyWorkspace[] = [
  {
    mission: "womanhood",
    missionTitle: "Research Mission 001 — Womanhood",
    economyScore: 76,
    valueGeneration: 79,
    revenuePotential: 74,
    costOptimization: 75,
    profitMargin: 73,
    capitalEfficiency: 77,
    growthRate: 78,
    healthScore: 76,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  },
]

export const missionEconomyRoadmap = [
  { quarter: "Q3", title: "Value Framework", status: "completed" as const, items: 6 },
  { quarter: "Q4", title: "Revenue Streams", status: "in-progress" as const, items: 9 },
  { quarter: "Q1", title: "Scale Economy", status: "planned" as const, items: 11 },
]
