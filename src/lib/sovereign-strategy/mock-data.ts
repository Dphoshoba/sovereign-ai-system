import { MissionSovereignStrategyWorkspace } from "./types"

export const sovereignStrategyMockData: MissionSovereignStrategyWorkspace[] = [
  {
    mission: "womanhood",
    missionTitle: "Research Mission 001 — Womanhood",
    strategyScore: 78,
    alignmentScore: 82,
    executionScore: 75,
    missionCohesion: 81,
    resourceAllocation: 72,
    successProbability: 76,
    riskMitigation: 73,
    healthScore: 78,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  },
]

export const sovereignStrategyRoadmap = [
  { quarter: "Q3", title: "Strategic Framework", status: "completed" as const, items: 5 },
  { quarter: "Q4", title: "Alignment Protocol", status: "in-progress" as const, items: 8 },
  { quarter: "Q1", title: "Execution Deployment", status: "planned" as const, items: 12 },
]
