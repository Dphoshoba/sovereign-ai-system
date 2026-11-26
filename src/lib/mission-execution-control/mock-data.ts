import { MissionMissionExecutionControlWorkspace } from "./types"

export const missionExecutionControlMockData: MissionMissionExecutionControlWorkspace[] = [
  {
    mission: "womanhood",
    missionTitle: "Research Mission 001 — Womanhood",
    executionScore: 80,
    taskCompletion: 82,
    milestoneTracking: 79,
    resourceUtilization: 81,
    timelineAdherence: 78,
    qualityAssurance: 83,
    teamCoordination: 77,
    healthScore: 80,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  },
]

export const missionExecutionControlRoadmap = [
  { quarter: "Q3", title: "Execution Framework", status: "completed" as const, items: 7 },
  { quarter: "Q4", title: "Control Mechanisms", status: "in-progress" as const, items: 10 },
  { quarter: "Q1", title: "Full Deployment", status: "planned" as const, items: 11 },
]
