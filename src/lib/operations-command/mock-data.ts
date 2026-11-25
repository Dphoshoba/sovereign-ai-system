import { MissionOperationsCommandWorkspace } from "./types"

export const operationsCommandMockData: MissionOperationsCommandWorkspace[] = [
  {
    mission: "womanhood",
    missionTitle: "Research Mission 001 — Womanhood",
    commandScore: 79,
    executionReadiness: 81,
    systemReliability: 78,
    resourceCoordination: 80,
    responseTime: 77,
    decisionQuality: 82,
    operationalExcellence: 76,
    healthScore: 79,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  },
]

export const operationsCommandRoadmap = [
  { quarter: "Q3", title: "Command Structure", status: "completed" as const, items: 6 },
  { quarter: "Q4", title: "Execution Protocol", status: "in-progress" as const, items: 9 },
  { quarter: "Q1", title: "Operations Excellence", status: "planned" as const, items: 10 },
]
