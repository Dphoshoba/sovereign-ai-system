import {
  runAutonomousResearchMissionEngine,
  summarizeMissionEngineResult,
} from "../research/mission-engine"
import {
  buildGovernedDraftPreview,
  summarizeGovernedDraftPreview,
} from "../content/draft-preview-engine"

export type OperatorDashboardStatus =
  | "READY"
  | "PARTIAL"
  | "REVIEW_REQUIRED"
  | "BLOCKED"

export type EVKOSSafetyFlags = {
  writesToPrisma: false
  graphWrites: false
  graphDeletes: false
  automaticApprovals: false
  automaticPublishing: false
  socialPosting: false
  openAiCalls: false
}

export type OperatorDashboardSection = {
  title: string
  status: OperatorDashboardStatus
  score: number
  summary: string
  metrics: Array<{
    label: string
    value: string | number
  }>
}

export type EVKOSOperatorDashboard = {
  ok: true
  readOnly: true
  readinessScore: number
  readinessStatus: OperatorDashboardStatus
  missionSummary: {
    missionCount: number
    queued: number
    active: number
    blocked: number
    completed: number
    readinessScore: number
    nextAction: string
  }
  campaignSummary: {
    campaignId: string
    totalAssets: number
    readyAssets: number
    blockedAssets: number
    reviewRequiredAssets: number
    readinessScore: number
    readinessStatus: string
  }
  draftSummary: {
    packetCount: number
    readinessScore: number
    readinessStatus: string
    blockedAssets: number
    reviewRequiredAssets: number
    generatedContent: false
  }
  reviewSummary: {
    requiredItems: number
    bottlenecks: string[]
    status: OperatorDashboardStatus
  }
  approvalSummary: {
    requiredPackages: number
    automaticApprovals: false
    status: OperatorDashboardStatus
    notes: string[]
  }
  graphSummary: {
    readinessScore: number
    readinessStatus: OperatorDashboardStatus
    graphWrites: false
    graphDeletes: false
    summary: string
  }
  publishingSummary: {
    readinessStatus: OperatorDashboardStatus
    automaticPublishing: false
    socialPosting: false
    summary: string
  }
  safetyFlags: EVKOSSafetyFlags
  blockers: string[]
  recommendedActions: string[]
  sections: OperatorDashboardSection[]
}

export function buildEVKOSOperatorDashboard(): EVKOSOperatorDashboard {
  const missionResult = runAutonomousResearchMissionEngine({
    recentCategories: ["ai-tools"],
    duplicateTopics: ["AI automation for creator workflows"],
  })
  const missionSummary = summarizeMissionEngineResult(missionResult)
  const draftPreview = buildGovernedDraftPreview()
  const draftSummary = summarizeGovernedDraftPreview(draftPreview)
  const campaignPreview = draftPreview.campaignPreview
  const reviewBottlenecks = [
    ...draftPreview.dashboard.reviewBottlenecks,
    "Review queue decisions remain human-gated before generation or publication.",
  ]
  const approvalNotes = [
    ...campaignPreview.approvalSummary.reasons,
    "Approval packages are surfaced only as status; this dashboard does not approve or reject.",
  ]
  const graphReadinessScore = 85
  const publishingSafetyScore = 100
  const readinessScore = Math.round(
    (missionSummary.readinessScore +
      campaignPreview.readiness.score +
      draftSummary.readinessScore +
      graphReadinessScore +
      publishingSafetyScore) /
      5
  )
  const blockers = [
    "Real AI draft generation still needs an explicit governed generation executor.",
    "Publishing and social posting remain blocked by design.",
    "Graph ingestion remains behind review, duplicate, tenant, and explicit write gates.",
  ]
  const sections: OperatorDashboardSection[] = [
    {
      title: "System readiness",
      status: "PARTIAL",
      score: readinessScore,
      summary:
        "EV-KOS has research, ontology, graph safety, and content preview layers, but execution remains gated.",
      metrics: [
        { label: "Overall readiness", value: readinessScore },
        { label: "Safety flags active", value: 7 },
      ],
    },
    {
      title: "Research missions",
      status: missionSummary.blocked > 0 ? "BLOCKED" : "PARTIAL",
      score: missionSummary.readinessScore,
      summary: missionSummary.nextAction,
      metrics: [
        { label: "Missions", value: missionSummary.missionCount },
        { label: "Queued", value: missionSummary.queued },
        { label: "Active", value: missionSummary.active },
        { label: "Blocked", value: missionSummary.blocked },
      ],
    },
    {
      title: "Content campaigns",
      status: "REVIEW_REQUIRED",
      score: campaignPreview.readiness.score,
      summary: "Campaign assets are planned and traceable; human review remains required.",
      metrics: [
        { label: "Assets", value: campaignPreview.totalAssets },
        { label: "Review required", value: campaignPreview.reviewRequiredAssets },
      ],
    },
    {
      title: "Draft preview pipeline",
      status: "REVIEW_REQUIRED",
      score: draftSummary.readinessScore,
      summary: "Preview packets are assembled without generated text or database writes.",
      metrics: [
        { label: "Packets", value: draftSummary.packets },
        { label: "Blocked", value: draftSummary.blockedAssets },
      ],
    },
    {
      title: "Review queue",
      status: "REVIEW_REQUIRED",
      score: 76,
      summary: "Review bottlenecks are visible but no review action can be taken here.",
      metrics: [{ label: "Required items", value: campaignPreview.reviewQueueSummary.required }],
    },
    {
      title: "Approval packages",
      status: "REVIEW_REQUIRED",
      score: 72,
      summary: "Approval package state is summarized only; no approve or reject controls exist.",
      metrics: [{ label: "Required packages", value: campaignPreview.approvalSummary.required }],
    },
    {
      title: "Graph readiness",
      status: "PARTIAL",
      score: graphReadinessScore,
      summary: "Graph writes remain guarded by explicit write, tenant, review, and duplicate checks.",
      metrics: [
        { label: "Graph writes", value: "false" },
        { label: "Graph deletes", value: "false" },
      ],
    },
    {
      title: "Publishing safety",
      status: "BLOCKED",
      score: publishingSafetyScore,
      summary: "Publishing and social posting are blocked from this dashboard.",
      metrics: [
        { label: "Auto publishing", value: "false" },
        { label: "Social posting", value: "false" },
      ],
    },
  ]

  return {
    ok: true,
    readOnly: true,
    readinessScore,
    readinessStatus: readinessScore >= 85 ? "READY" : "PARTIAL",
    missionSummary: {
      missionCount: missionSummary.missionCount,
      queued: missionSummary.queued,
      active: missionSummary.active,
      blocked: missionSummary.blocked,
      completed: missionSummary.completed,
      readinessScore: missionSummary.readinessScore,
      nextAction: missionSummary.nextAction,
    },
    campaignSummary: {
      campaignId: campaignPreview.campaignId,
      totalAssets: campaignPreview.totalAssets,
      readyAssets: campaignPreview.readyAssets,
      blockedAssets: campaignPreview.blockedAssets,
      reviewRequiredAssets: campaignPreview.reviewRequiredAssets,
      readinessScore: campaignPreview.readiness.score,
      readinessStatus: campaignPreview.readiness.status,
    },
    draftSummary: {
      packetCount: draftSummary.packets,
      readinessScore: draftSummary.readinessScore,
      readinessStatus: draftSummary.readinessStatus,
      blockedAssets: draftSummary.blockedAssets,
      reviewRequiredAssets: draftSummary.reviewRequiredAssets,
      generatedContent: false,
    },
    reviewSummary: {
      requiredItems: campaignPreview.reviewQueueSummary.required,
      bottlenecks: reviewBottlenecks,
      status: "REVIEW_REQUIRED",
    },
    approvalSummary: {
      requiredPackages: campaignPreview.approvalSummary.required,
      automaticApprovals: false,
      status: "REVIEW_REQUIRED",
      notes: approvalNotes,
    },
    graphSummary: {
      readinessScore: graphReadinessScore,
      readinessStatus: "PARTIAL",
      graphWrites: false,
      graphDeletes: false,
      summary:
        "Knowledge graph writes are not available from the operator dashboard foundation.",
    },
    publishingSummary: {
      readinessStatus: "BLOCKED",
      automaticPublishing: false,
      socialPosting: false,
      summary:
        "Publishing, social posting, and automatic outbound actions are intentionally unavailable.",
    },
    safetyFlags: {
      writesToPrisma: false,
      graphWrites: false,
      graphDeletes: false,
      automaticApprovals: false,
      automaticPublishing: false,
      socialPosting: false,
      openAiCalls: false,
    },
    blockers,
    recommendedActions: [
      "Review the Phase 6C draft preview packets before designing generation execution.",
      "Design Phase 7B operator review controls as separate explicit actions.",
      "Keep graph writes and publishing behind their existing approval boundaries.",
    ],
    sections,
  }
}
