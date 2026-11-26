import type { MissionControlWorkspace } from "../mission-control/types"

const FIXED_TIMESTAMP = 1751990400000

export async function getMissionControl(slug: string): Promise<MissionControlWorkspace | null> {
  if (!slug) return null
  
  return {
    mission: slug,
    missionTitle: `${slug} Mission Control Center`,
    missionScore: 85,
    executiveScore: 88,
    plannerScore: 82,
    advisorScore: 80,
    reviewScore: 84,
    readinessScore: 82,
    momentumScore: 79,
    healthScore: 86,
    knowledgeDebt: 18,
    riskScore: 12,
    opportunityScore: 75,
    alignmentScore: 84,
    executionScore: 81,
    priorityCount: 12,
    decisionCount: 8,
    blockerCount: 2,
    recommendationCount: 5,
    actionCount: 8,
    missionStatus: [{ title: "Active", score: 85, summary: "Mission is on track" }],
    executiveView: [{ title: "Strategic Alignment", score: 88, summary: "Well aligned" }],
    advisorInsights: ["Mission progressing well"],
    executionRadar: [{ title: "Execution", score: 81, summary: "On schedule" }],
    plannerQueue: ["Next phase planning"],
    reviewSnapshot: ["Review completed successfully"],
    risks: [{ title: "Resource Constraint", score: 12, severity: "low", mitigation: "Plan ahead" }],
    opportunities: [{ title: "Growth Opportunity", score: 75, action: "Pursue expansion" }],
    recommendations: ["Continue current strategy"],
    immediateActions: [{ title: "Complete milestone", priority: "high", owner: "Team Lead", rationale: "Critical path" }],
    nextSevenDays: ["Complete phase 1"],
    missionOutlook: ["Strong momentum building"],
    roadmap: [{ date: "2026-07-08", event: "Milestone 1", status: "completed" }],
    readOnly: true,
    previewOnly: true,
    noAuth: true,
    noSessions: true,
    noJwt: true,
    noDatabase: true,
    noExecution: true,
    noPublishing: true,
    noOpenAI: true,
    noGraphWrites: true,
    noSocialPosting: true,
  }
}

export async function getMissionControlRegistry(): Promise<{
  missionScore: number
  readinessScore: number
  healthScore: number
  knowledgeDebt: number
  riskScore: number
  opportunityScore: number
  timestamp: number
  missions: Array<MissionControlWorkspace>
}> {
  return {
    missionScore: 85,
    readinessScore: 82,
    healthScore: 86,
    knowledgeDebt: 18,
    riskScore: 12,
    opportunityScore: 75,
    timestamp: 1751328000000,
    missions: [
      {
        mission: "research-001",
        missionTitle: "Research Mission 001",
        missionScore: 85,
        executiveScore: 88,
        plannerScore: 82,
        advisorScore: 80,
        reviewScore: 84,
        readinessScore: 82,
        momentumScore: 79,
        healthScore: 86,
        knowledgeDebt: 18,
        riskScore: 12,
        opportunityScore: 75,
        alignmentScore: 84,
        executionScore: 81,
        priorityCount: 12,
        decisionCount: 8,
        blockerCount: 1,
        recommendationCount: 3,
        actionCount: 5,
        missionStatus: [{ title: "Active", score: 85, summary: "On track" }],
        executiveView: [{ title: "Strategic", score: 88, summary: "Aligned" }],
        advisorInsights: ["Progressing well"],
        executionRadar: [{ title: "Execution", score: 81, summary: "On time" }],
        plannerQueue: ["Phase 2 prep"],
        reviewSnapshot: ["Good progress"],
        risks: [{ title: "Risk", score: 12, severity: "low", mitigation: "Monitor" }],
        opportunities: [{ title: "Opportunity", score: 75, action: "Pursue" }],
        recommendations: ["Continue"],
        immediateActions: [{ title: "Action", priority: "high", owner: "Lead", rationale: "Critical" }],
        nextSevenDays: ["Complete"],
        missionOutlook: ["Positive"],
        roadmap: [{ date: "2026-07-08", event: "Milestone", status: "completed" }],
        readOnly: true,
        previewOnly: true,
        noAuth: true,
        noSessions: true,
        noJwt: true,
        noDatabase: true,
        noExecution: true,
        noPublishing: true,
        noOpenAI: true,
        noGraphWrites: true,
        noSocialPosting: true,
      },
    ],
  }
}
