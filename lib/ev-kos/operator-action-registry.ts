export type OperatorActionId =
  | "start-research-mission"
  | "refresh-readiness"
  | "prepare-draft-preview"
  | "build-review-package"
  | "validate-campaign"
  | "prepare-publication"
  | "view-graph-readiness"
  | "view-mission-health"

export type OperatorActionRiskLevel = "low" | "medium" | "high"

export type OperatorActionExecutionMode = "preview-only"

export type OperatorActionDefinition = {
  id: OperatorActionId
  name: string
  description: string
  requiredPermissions: string[]
  requiredApprovals: string[]
  requiredInputs: string[]
  estimatedImpact: string
  executionMode: OperatorActionExecutionMode
  riskLevel: OperatorActionRiskLevel
  affectedSystems: string[]
}

export const OPERATOR_ACTIONS: OperatorActionDefinition[] = [
  {
    id: "start-research-mission",
    name: "Start Research Mission",
    description:
      "Preview the governed requirements for moving a planned research mission toward execution.",
    requiredPermissions: ["operator:research:preview"],
    requiredApprovals: ["Research mission approval"],
    requiredInputs: ["missionId", "operatorId", "missionObjective"],
    estimatedImpact: "Creates a mission execution checklist; no sources are collected.",
    executionMode: "preview-only",
    riskLevel: "medium",
    affectedSystems: ["Research Missions", "Evidence Registry", "Review Queue"],
  },
  {
    id: "refresh-readiness",
    name: "Refresh Readiness",
    description:
      "Preview a refresh of EV-KOS readiness summaries across research, content, graph, and publishing safety.",
    requiredPermissions: ["operator:readiness:preview"],
    requiredApprovals: [],
    requiredInputs: ["operatorId"],
    estimatedImpact: "Recomputes read-only readiness summaries.",
    executionMode: "preview-only",
    riskLevel: "low",
    affectedSystems: ["Operator Dashboard", "System Readiness"],
  },
  {
    id: "prepare-draft-preview",
    name: "Prepare Draft Preview",
    description:
      "Preview draft packet preparation for an approved campaign without generating text.",
    requiredPermissions: ["operator:draft-preview:preview"],
    requiredApprovals: ["Campaign review approval"],
    requiredInputs: ["campaignId", "missionId", "operatorId"],
    estimatedImpact: "Assembles prompt packet readiness; no content is generated.",
    executionMode: "preview-only",
    riskLevel: "medium",
    affectedSystems: ["Content Campaigns", "Draft Preview Pipeline"],
  },
  {
    id: "build-review-package",
    name: "Build Review Package",
    description:
      "Preview the inputs needed to create a governed review package for human decision.",
    requiredPermissions: ["operator:review-package:preview"],
    requiredApprovals: ["Review queue owner approval"],
    requiredInputs: ["reviewItemId", "operatorId", "organizationId"],
    estimatedImpact: "Validates review package readiness; no package is persisted.",
    executionMode: "preview-only",
    riskLevel: "high",
    affectedSystems: ["Review Queue", "Approval Packages"],
  },
  {
    id: "validate-campaign",
    name: "Validate Campaign",
    description:
      "Preview campaign readiness, lineage completeness, review gates, and approval gaps.",
    requiredPermissions: ["operator:campaign:preview"],
    requiredApprovals: [],
    requiredInputs: ["campaignId", "operatorId"],
    estimatedImpact: "Returns campaign validation messages only.",
    executionMode: "preview-only",
    riskLevel: "low",
    affectedSystems: ["Content Campaigns", "Draft Preview Pipeline"],
  },
  {
    id: "prepare-publication",
    name: "Prepare Publication",
    description:
      "Preview publication readiness and unresolved approval gates without scheduling or publishing.",
    requiredPermissions: ["operator:publication:preview"],
    requiredApprovals: ["Editorial approval", "Publication approval"],
    requiredInputs: ["campaignId", "assetId", "operatorId"],
    estimatedImpact: "Surfaces publication blockers; no publishing queue is changed.",
    executionMode: "preview-only",
    riskLevel: "high",
    affectedSystems: ["Publishing Safety", "Approval Packages"],
  },
  {
    id: "view-graph-readiness",
    name: "View Graph Readiness",
    description:
      "Preview semantic graph readiness and write-boundary status without running graph operations.",
    requiredPermissions: ["operator:graph-readiness:preview"],
    requiredApprovals: [],
    requiredInputs: ["operatorId"],
    estimatedImpact: "Displays graph readiness status; no graph records are read or written.",
    executionMode: "preview-only",
    riskLevel: "medium",
    affectedSystems: ["Graph Readiness", "Knowledge Graph Safety"],
  },
  {
    id: "view-mission-health",
    name: "View Mission Health",
    description:
      "Preview mission health, blocked states, and estimated next actions.",
    requiredPermissions: ["operator:mission-health:preview"],
    requiredApprovals: [],
    requiredInputs: ["operatorId"],
    estimatedImpact: "Displays mission health summary only.",
    executionMode: "preview-only",
    riskLevel: "low",
    affectedSystems: ["Research Missions", "Operator Dashboard"],
  },
]

export function listOperatorActions() {
  return OPERATOR_ACTIONS
}

export function getOperatorAction(actionId: string) {
  return OPERATOR_ACTIONS.find((action) => action.id === actionId) ?? null
}

export function summarizeOperatorActions(
  actions: OperatorActionDefinition[] = OPERATOR_ACTIONS
) {
  return {
    total: actions.length,
    previewOnly: actions.filter((action) => action.executionMode === "preview-only")
      .length,
    requiringApproval: actions.filter(
      (action) => action.requiredApprovals.length > 0
    ).length,
    highRisk: actions.filter((action) => action.riskLevel === "high").length,
  }
}
