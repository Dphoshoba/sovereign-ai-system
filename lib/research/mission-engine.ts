import {
  nextMissionStates,
  validateMissionTransition,
  type ResearchMissionState,
} from "./mission-state-machine"
import {
  buildMissionPlans,
  summarizeMissionPlan,
  type ResearchMissionPlan,
} from "./mission-planner"
import {
  prioritizeResearchTopics,
  type ResearchPrioritizationResult,
} from "./research-prioritization"
import {
  discoverResearchTopics,
  type TopicDiscoveryCandidate,
  type TopicDiscoveryOptions,
  type TopicDiscoveryResult,
} from "./topic-discovery"

export type MissionReadinessArea =
  | "Research"
  | "Evidence"
  | "Verification"
  | "Ontology"
  | "Entity Resolution"
  | "Review Queue"
  | "Approval"
  | "Draft Generation"

export type MissionReadinessStatus = "READY" | "PARTIAL" | "BLOCKED"

export type MissionReadinessItem = {
  area: MissionReadinessArea
  status: MissionReadinessStatus
  score: number
  detail: string
}

export type MissionReadinessResult = {
  missionId: string
  overallScore: number
  status: MissionReadinessStatus
  graphWrites: false
  automaticApproval: false
  automaticPublishing: false
  items: MissionReadinessItem[]
  blockers: string[]
  nextAction: string
}

export type ResearchMissionDashboard = {
  dryRun: true
  writesToPrisma: false
  graphWrites: false
  automaticApprovals: false
  automaticPublishing: false
  activeMissions: ResearchMissionPlan[]
  queuedMissions: ResearchMissionPlan[]
  blockedMissions: ResearchMissionPlan[]
  completedMissions: ResearchMissionPlan[]
  failureReasons: Array<{ missionId: string; reason: string }>
  readiness: MissionReadinessResult[]
  estimatedNextAction: string
}

export type AutonomousResearchMissionResult = {
  dryRun: true
  writesToPrisma: false
  graphWrites: false
  graphDeletes: false
  automaticApprovals: false
  automaticPublishing: false
  topicDiscovery: TopicDiscoveryResult
  prioritization: ResearchPrioritizationResult
  missionPlans: ResearchMissionPlan[]
  dashboard: ResearchMissionDashboard
  integrationFlow: string[]
}

export type MissionEngineOptions = TopicDiscoveryOptions & {
  candidates?: TopicDiscoveryCandidate[]
}

export function runAutonomousResearchMissionEngine(
  options: MissionEngineOptions = {}
): AutonomousResearchMissionResult {
  const topicDiscovery = discoverResearchTopics(options.candidates, options)
  const prioritization = prioritizeResearchTopics(topicDiscovery.candidates)
  const missionPlans = buildMissionPlans(prioritization.prioritized)
  const readiness = missionPlans.map(evaluateMissionReadiness)

  return {
    dryRun: true,
    writesToPrisma: false,
    graphWrites: false,
    graphDeletes: false,
    automaticApprovals: false,
    automaticPublishing: false,
    topicDiscovery,
    prioritization,
    missionPlans,
    dashboard: buildMissionDashboard(missionPlans, readiness),
    integrationFlow: [
      "Topic Discovery",
      "Mission Planner",
      "Research Pipeline",
      "Evidence Registry",
      "Fact Extraction",
      "Consensus",
      "Ontology",
      "Entity Resolution",
      "Review Queue",
      "Review Packages",
      "Review Decision",
      "Draft Generation",
      "Transaction Preview",
    ],
  }
}

export function evaluateMissionReadiness(
  mission: ResearchMissionPlan
): MissionReadinessResult {
  const items: MissionReadinessItem[] = [
    readinessItem(
      "Research",
      mission.priorityScore >= 60,
      mission.state !== "BLOCKED",
      Math.min(100, mission.priorityScore),
      "Mission topic has enough priority to enter the governed research pipeline."
    ),
    readinessItem(
      "Evidence",
      mission.priorityBand !== "BLOCKED",
      mission.riskLevel !== "high" || mission.manualRequest,
      mission.riskLevel === "high" ? 68 : 82,
      "Evidence collection must use source-grounded registry outputs."
    ),
    readinessItem(
      "Verification",
      mission.priorityBand !== "BLOCKED",
      true,
      mission.riskLevel === "high" ? 72 : 86,
      "Claims must pass existing verification and consensus gates before downstream use."
    ),
    readinessItem(
      "Ontology",
      true,
      mission.category !== "health",
      mission.category === "health" ? 70 : 88,
      "Ontology mapping is available; high-risk domains require tighter review."
    ),
    readinessItem(
      "Entity Resolution",
      mission.duplicateRisk < 82,
      mission.duplicateRisk < 60,
      Math.max(40, 100 - mission.duplicateRisk),
      "Duplicate avoidance score determines entity resolution readiness."
    ),
    readinessItem(
      "Review Queue",
      true,
      true,
      90,
      "Review queue can prepare duplicate, conflict, and review-required packages."
    ),
    readinessItem(
      "Approval",
      false,
      mission.state === "REVIEW_READY" || mission.state === "APPROVED",
      mission.state === "APPROVED" ? 90 : 50,
      "Human approval is mandatory and is never created automatically."
    ),
    readinessItem(
      "Draft Generation",
      mission.state === "APPROVED" || mission.state === "DRAFT_READY",
      mission.priorityBand !== "BLOCKED",
      mission.state === "DRAFT_READY" ? 90 : 58,
      "Draft generation remains downstream of evidence, consensus, and human approval."
    ),
  ]
  const blockers = items
    .filter((item) => item.status === "BLOCKED")
    .map((item) => `${item.area}: ${item.detail}`)
  const overallScore = Math.round(
    items.reduce((sum, item) => sum + item.score, 0) / items.length
  )

  return {
    missionId: mission.id,
    overallScore,
    status:
      blockers.length > 0
        ? "BLOCKED"
        : items.some((item) => item.status === "PARTIAL")
          ? "PARTIAL"
          : "READY",
    graphWrites: false,
    automaticApproval: false,
    automaticPublishing: false,
    items,
    blockers,
    nextAction:
      blockers.length > 0
        ? "Resolve blockers before mission execution."
        : mission.estimatedNextAction,
  }
}

export function buildMissionDashboard(
  missions: ResearchMissionPlan[],
  readiness: MissionReadinessResult[] = missions.map(evaluateMissionReadiness)
): ResearchMissionDashboard {
  const activeStates: ResearchMissionState[] = [
    "RESEARCHING",
    "COLLECTING",
    "VERIFYING",
    "EXTRACTING",
    "CONSENSUS",
    "ONTOLOGY",
    "ENTITY_RESOLUTION",
    "REVIEW_READY",
    "APPROVED",
    "DRAFT_READY",
  ]
  const queuedMissions = missions.filter((mission) =>
    ["DISCOVERED", "PLANNED"].includes(mission.state)
  )
  const blockedMissions = missions.filter((mission) => mission.state === "BLOCKED")
  const completedMissions = missions.filter(
    (mission) => mission.state === "COMPLETED"
  )

  return {
    dryRun: true,
    writesToPrisma: false,
    graphWrites: false,
    automaticApprovals: false,
    automaticPublishing: false,
    activeMissions: missions.filter((mission) =>
      activeStates.includes(mission.state)
    ),
    queuedMissions,
    blockedMissions,
    completedMissions,
    failureReasons: missions
      .filter((mission) => ["FAILED", "BLOCKED"].includes(mission.state))
      .map((mission) => ({
        missionId: mission.id,
        reason:
          mission.state === "BLOCKED"
            ? "Mission is blocked by duplicate, governance, or readiness conditions."
            : "Mission failed in a previous execution attempt.",
      })),
    readiness,
    estimatedNextAction:
      queuedMissions[0]?.estimatedNextAction ??
      blockedMissions[0]?.estimatedNextAction ??
      "No queued mission is ready for action.",
  }
}

export function validateMissionLifecycleTransition(
  from: ResearchMissionState,
  to: ResearchMissionState
) {
  return validateMissionTransition(from, to)
}

export function summarizeMissionEngineResult(
  result: AutonomousResearchMissionResult
) {
  const readinessScores = result.dashboard.readiness.map(
    (readiness) => readiness.overallScore
  )
  const readinessScore =
    readinessScores.length === 0
      ? 0
      : Math.round(
          readinessScores.reduce((sum, score) => sum + score, 0) /
            readinessScores.length
        )

  return {
    dryRun: true,
    missionCount: result.missionPlans.length,
    queued: result.dashboard.queuedMissions.length,
    active: result.dashboard.activeMissions.length,
    blocked: result.dashboard.blockedMissions.length,
    completed: result.dashboard.completedMissions.length,
    readinessScore,
    graphWrites: false,
    automaticApprovals: false,
    automaticPublishing: false,
    nextAction: result.dashboard.estimatedNextAction,
    firstMission: result.missionPlans[0]
      ? summarizeMissionPlan(result.missionPlans[0])
      : null,
  }
}

export { nextMissionStates }

function readinessItem(
  area: MissionReadinessArea,
  prerequisite: boolean,
  mature: boolean,
  score: number,
  detail: string
): MissionReadinessItem {
  return {
    area,
    status: prerequisite ? (mature ? "READY" : "PARTIAL") : "BLOCKED",
    score: prerequisite ? score : Math.min(score, 45),
    detail,
  }
}
