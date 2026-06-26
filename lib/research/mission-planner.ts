import type { DomainCategory } from "../ontology"
import type { PrioritizedResearchTopic } from "./research-prioritization"
import {
  estimateNextMissionAction,
  type ResearchMissionState,
} from "./mission-state-machine"

export type ResearchMissionPlanStep = {
  order: number
  state: ResearchMissionState
  system:
    | "topic-discovery"
    | "mission-planner"
    | "source-collector"
    | "evidence-registry"
    | "fact-extractor"
    | "fact-verification"
    | "consensus-engine"
    | "ontology"
    | "entity-resolution"
    | "review-queue"
    | "review-package"
    | "review-decision"
    | "draft-generation"
    | "transaction-preview"
  action: string
  writesToPrisma: false
  graphWrites: false
  publishing: false
  approval: false
}

export type ResearchMissionPlan = {
  id: string
  topic: string
  category: DomainCategory
  state: ResearchMissionState
  priorityScore: number
  priorityBand: PrioritizedResearchTopic["priorityBand"]
  riskLevel: PrioritizedResearchTopic["riskLevel"]
  estimatedEffort: PrioritizedResearchTopic["estimatedEffort"]
  manualRequest: boolean
  duplicateRisk: number
  steps: ResearchMissionPlanStep[]
  governance: {
    humanApprovalRequired: true
    automaticApproval: false
    automaticPublishing: false
    graphWrites: false
    transactionMode: "preview-only"
  }
  estimatedNextAction: string
}

export function buildResearchMissionPlan(
  topic: PrioritizedResearchTopic
): ResearchMissionPlan {
  const state: ResearchMissionState =
    topic.priorityBand === "BLOCKED" ? "BLOCKED" : "PLANNED"

  return {
    id: buildMissionId(topic.topic),
    topic: topic.topic,
    category: topic.category,
    state,
    priorityScore: topic.totalScore,
    priorityBand: topic.priorityBand,
    riskLevel: topic.riskLevel,
    estimatedEffort: topic.estimatedEffort,
    manualRequest: Boolean(topic.manualRequest),
    duplicateRisk: topic.duplicateSimilarity ?? 0,
    steps: buildPlanSteps(),
    governance: {
      humanApprovalRequired: true,
      automaticApproval: false,
      automaticPublishing: false,
      graphWrites: false,
      transactionMode: "preview-only",
    },
    estimatedNextAction: estimateNextMissionAction(state),
  }
}

export function buildMissionPlans(
  topics: PrioritizedResearchTopic[]
): ResearchMissionPlan[] {
  return topics.map(buildResearchMissionPlan)
}

export function summarizeMissionPlan(plan: ResearchMissionPlan) {
  return {
    id: plan.id,
    topic: plan.topic,
    category: plan.category,
    state: plan.state,
    priorityScore: plan.priorityScore,
    priorityBand: plan.priorityBand,
    riskLevel: plan.riskLevel,
    stepCount: plan.steps.length,
    graphWrites: false,
    automaticApproval: false,
    automaticPublishing: false,
    estimatedNextAction: plan.estimatedNextAction,
  }
}

function buildPlanSteps(): ResearchMissionPlanStep[] {
  const steps: Array<Omit<ResearchMissionPlanStep, "order">> = [
    {
      state: "DISCOVERED",
      system: "topic-discovery",
      action: "Score candidate topics from gaps, freshness, priority, diversity, manual requests, trending placeholder, and duplicate avoidance.",
      writesToPrisma: false,
      graphWrites: false,
      publishing: false,
      approval: false,
    },
    {
      state: "PLANNED",
      system: "mission-planner",
      action: "Create a governed mission plan and readiness checklist.",
      writesToPrisma: false,
      graphWrites: false,
      publishing: false,
      approval: false,
    },
    {
      state: "RESEARCHING",
      system: "source-collector",
      action: "Use existing source collection under operator-approved mission execution.",
      writesToPrisma: false,
      graphWrites: false,
      publishing: false,
      approval: false,
    },
    {
      state: "COLLECTING",
      system: "evidence-registry",
      action: "Register evidence chunks and preserve source links.",
      writesToPrisma: false,
      graphWrites: false,
      publishing: false,
      approval: false,
    },
    {
      state: "VERIFYING",
      system: "fact-verification",
      action: "Verify claims against evidence before extraction moves downstream.",
      writesToPrisma: false,
      graphWrites: false,
      publishing: false,
      approval: false,
    },
    {
      state: "EXTRACTING",
      system: "fact-extractor",
      action: "Extract structured facts and semantic claims.",
      writesToPrisma: false,
      graphWrites: false,
      publishing: false,
      approval: false,
    },
    {
      state: "CONSENSUS",
      system: "consensus-engine",
      action: "Group verified facts into consensus themes.",
      writesToPrisma: false,
      graphWrites: false,
      publishing: false,
      approval: false,
    },
    {
      state: "ONTOLOGY",
      system: "ontology",
      action: "Map verified outputs into the universal ontology contract.",
      writesToPrisma: false,
      graphWrites: false,
      publishing: false,
      approval: false,
    },
    {
      state: "ENTITY_RESOLUTION",
      system: "entity-resolution",
      action: "Run duplicate-safe entity resolution dry-run.",
      writesToPrisma: false,
      graphWrites: false,
      publishing: false,
      approval: false,
    },
    {
      state: "REVIEW_READY",
      system: "review-queue",
      action: "Prepare review queue items and review packages for human decision.",
      writesToPrisma: false,
      graphWrites: false,
      publishing: false,
      approval: false,
    },
    {
      state: "APPROVED",
      system: "review-decision",
      action: "Accept external human decision context; never auto-approve.",
      writesToPrisma: false,
      graphWrites: false,
      publishing: false,
      approval: false,
    },
    {
      state: "DRAFT_READY",
      system: "draft-generation",
      action: "Prepare source-grounded draft for human editorial review.",
      writesToPrisma: false,
      graphWrites: false,
      publishing: false,
      approval: false,
    },
    {
      state: "COMPLETED",
      system: "transaction-preview",
      action: "Return transaction preview and archive readiness summary; no graph write or publication.",
      writesToPrisma: false,
      graphWrites: false,
      publishing: false,
      approval: false,
    },
  ]

  return steps.map((step, index) => ({
    order: index + 1,
    ...step,
  }))
}

function buildMissionId(topic: string) {
  return `research-mission:${topic
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`
}
