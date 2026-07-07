import { MissionKingdomEnterpriseWorkspace } from "./types"

export const kingdomEnterpriseMockData: MissionKingdomEnterpriseWorkspace[] = [
  {
    mission: "womanhood",
    missionTitle: "Research Mission 001 — Womanhood",
    enterpriseScore: 80,
    scaleScore: 78,
    disciplineScore: 82,
    leadershipScore: 79,
    operationalScore: 77,
    financialScore: 75,
    culturalScore: 81,
    healthScore: 80,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  },
]

export const kingdomEnterpriseRoadmap = [
  { quarter: "Q3", title: "Enterprise Foundation", status: "completed" as const, items: 8 },
  { quarter: "Q4", title: "Scale Operations", status: "in-progress" as const, items: 10 },
  { quarter: "Q1", title: "Global Integration", status: "planned" as const, items: 12 },
]
