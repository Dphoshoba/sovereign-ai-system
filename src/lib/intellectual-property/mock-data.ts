import { MissionIntellectualPropertyWorkspace } from "./types"

export const intellectualPropertyMockData: MissionIntellectualPropertyWorkspace[] = [
  {
    mission: "womanhood",
    missionTitle: "Research Mission 001 — Womanhood",
    ipScore: 77,
    innovationScore: 80,
    protectionScore: 76,
    licensingPotential: 74,
    patentStrength: 75,
    trademarkValue: 78,
    copyrightCoverage: 79,
    healthScore: 77,
    previewOnly: true,
    noAuth: true,
    noDatabase: true,
  },
]

export const intellectualPropertyRoadmap = [
  { quarter: "Q3", title: "IP Mapping", status: "completed" as const, items: 7 },
  { quarter: "Q4", title: "Protection Protocol", status: "in-progress" as const, items: 8 },
  { quarter: "Q1", title: "Licensing Strategy", status: "planned" as const, items: 10 },
]
