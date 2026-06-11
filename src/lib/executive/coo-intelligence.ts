import { getBusinessSnapshot } from "@/lib/business/business-data-layer"
import { generateExecutiveAutomationActions } from "@/lib/executive/automation-engine"
import { buildBusinessMemory } from "@/lib/executive/business-memory"
import { buildClientIntelligence } from "@/lib/executive/client-intelligence"
import { prisma } from "@/lib/prisma"

// Phase 32 — COO Operations Intelligence Layer.
// Operations intelligence above business memory, client intelligence, and
// automation actions: delivery health, workload, forecasts, bottlenecks, and
// COO-level recommendations. Deterministic only. No OpenAI. Production safe.

export type OperationsStatus = "Healthy" | "Stable" | "Warning" | "Critical"

export type CooBottleneckType =
  | "overdue_project_bottleneck"
  | "open_task_bottleneck"
  | "high_priority_task_bottleneck"
  | "client_delivery_bottleneck"
  | "no_completed_project_bottleneck"

export type CooBottleneck = {
  type: CooBottleneckType
  title: string
  severity: "low" | "medium" | "high" | "critical"
  impact: string
  resolution: string
}

export type CooRiskType =
  | "delivery_risk"
  | "capacity_risk"
  | "client_trust_risk"
  | "execution_risk"

export type CooRisk = {
  type: CooRiskType
  title: string
  severity: "low" | "medium" | "high" | "critical"
  impact: string
  mitigation: string
}

export type CooOpportunityType =
  | "delivery_systemization"
  | "task_cleanup"
  | "client_review"
  | "project_completion_push"

export type CooOpportunity = {
  type: CooOpportunityType
  title: string
  value: number
  action: string
}

export type CooIntelligence = {
  operationsHealth: number
  deliveryHealth: {
    score: number
    status: OperationsStatus
  }
  workloadHealth: {
    score: number
    openTasks: number
    highPriorityTasks: number
    overdueTasks: number
    operationalLoad: number
  }
  projectForecast: {
    activeProjects: number
    overdueProjects: number
    completionRisk: "low" | "medium" | "high"
    deliveryCapacity: number
  }
  taskForecast: {
    open: number
    inProgress: number
    completed: number
    overdue: number
    highPriority: number
  }
  bottlenecks: CooBottleneck[]
  risks: CooRisk[]
  opportunities: CooOpportunity[]
  recommendations: string[]
  generatedAt: string
}

const HIGH_OPEN_TASK_THRESHOLD = 10
const HIGH_LOAD_THRESHOLD = 70

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function statusFromScore(score: number): OperationsStatus {
  return score >= 75
    ? "Healthy"
    : score >= 55
      ? "Stable"
      : score >= 35
        ? "Warning"
        : "Critical"
}

/** Best-effort daily snapshot persistence — never fails the caller. */
async function storeCooSnapshot(coo: CooIntelligence) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const title = `COO Intelligence Snapshot ${today}`

    const content = JSON.stringify({
      operationsHealth: coo.operationsHealth,
      deliveryHealth: coo.deliveryHealth,
      workloadHealth: coo.workloadHealth,
      projectForecast: coo.projectForecast,
      bottleneckCount: coo.bottlenecks.length,
      riskCount: coo.risks.length,
      opportunityCount: coo.opportunities.length,
      recommendations: coo.recommendations,
    })

    const existing = await prisma.aiMemory.findFirst({
      where: { type: "coo-intelligence-snapshot", title },
    })

    if (existing) {
      await prisma.aiMemory.update({
        where: { id: existing.id },
        data: { content },
      })
    } else {
      await prisma.aiMemory.create({
        data: {
          type: "coo-intelligence-snapshot",
          title,
          content,
          source: "coo-intelligence",
          tags: "executive,coo,operations,snapshot",
        },
      })
    }
  } catch (error) {
    console.error("Failed to store COO snapshot:", error)
  }
}

export async function buildCooIntelligence(): Promise<CooIntelligence> {
  const now = new Date()

  // Shared inputs, fetched once and reused across engines (production safe).
  const snapshot = await getBusinessSnapshot()
  const memory = await buildBusinessMemory({ snapshot })
  const clientIntel = await buildClientIntelligence({ snapshot })
  const automation = await generateExecutiveAutomationActions({
    snapshot,
    memory,
    clientIntel,
  })

  const { projects, tasks, clients, operations } = snapshot

  // ---------------------------------------------------------------------------
  // Workload health.
  // ---------------------------------------------------------------------------
  const workloadScore = Math.round(
    clamp(
      100 -
        operations.operationalLoad * 0.5 -
        tasks.overdue * 10 -
        Math.max(0, tasks.open - HIGH_OPEN_TASK_THRESHOLD) * 3,
      0,
      100
    )
  )

  const workloadHealth = {
    score: workloadScore,
    openTasks: tasks.open,
    highPriorityTasks: tasks.highPriority,
    overdueTasks: tasks.overdue,
    operationalLoad: operations.operationalLoad,
  }

  // ---------------------------------------------------------------------------
  // Delivery health.
  // ---------------------------------------------------------------------------
  const deliveryScore = Math.round(
    clamp(
      50 +
        projects.completed * 8 +
        Math.min(tasks.completed * 2, 10) -
        projects.overdue * 15 -
        tasks.overdue * 8 -
        (projects.active === 0 && projects.completed === 0 ? 10 : 0),
      0,
      100
    )
  )

  const deliveryHealth = {
    score: deliveryScore,
    status: statusFromScore(deliveryScore),
  }

  // ---------------------------------------------------------------------------
  // Forecasts.
  // ---------------------------------------------------------------------------
  const completionRisk: "low" | "medium" | "high" =
    projects.overdue > 0
      ? "high"
      : tasks.open > HIGH_OPEN_TASK_THRESHOLD || tasks.overdue > 0
        ? "medium"
        : "low"

  const projectForecast = {
    activeProjects: projects.active,
    overdueProjects: projects.overdue,
    completionRisk,
    deliveryCapacity: Math.round(
      clamp(100 - operations.operationalLoad, 0, 100)
    ),
  }

  const taskForecast = {
    open: tasks.open,
    inProgress: tasks.inProgress,
    completed: tasks.completed,
    overdue: tasks.overdue,
    highPriority: tasks.highPriority,
  }

  // ---------------------------------------------------------------------------
  // Bottlenecks.
  // ---------------------------------------------------------------------------
  const bottlenecks: CooBottleneck[] = []

  if (projects.overdue > 0) {
    bottlenecks.push({
      type: "overdue_project_bottleneck",
      title: `${projects.overdue} overdue project${projects.overdue === 1 ? "" : "s"} blocking delivery flow`,
      severity: "high",
      impact:
        "Overdue projects consume attention, delay invoicing, and push every downstream commitment back.",
      resolution:
        "Set a recovery date per overdue project and clear them before opening new delivery work.",
    })
  }

  if (tasks.open > HIGH_OPEN_TASK_THRESHOLD) {
    bottlenecks.push({
      type: "open_task_bottleneck",
      title: `${tasks.open} open tasks exceed healthy capacity`,
      severity: "medium",
      impact:
        "A large open-task backlog hides priorities and slows every active project.",
      resolution:
        "Run a task triage: close stale tasks, batch small ones, and cap work-in-progress.",
    })
  }

  if (tasks.highPriority >= 3) {
    bottlenecks.push({
      type: "high_priority_task_bottleneck",
      title: `${tasks.highPriority} high-priority tasks competing for attention`,
      severity: "medium",
      impact:
        "When everything is high priority, nothing is — urgent work starves scheduled work.",
      resolution:
        "Re-rank high-priority tasks; only client-blocking items keep the flag.",
    })
  }

  const atRiskWithProjects = clientIntel.clients.filter(
    (client) =>
      client.relationshipStatus === "At Risk" && client.activeProjects > 0
  )

  if (atRiskWithProjects.length > 0) {
    bottlenecks.push({
      type: "client_delivery_bottleneck",
      title: `${atRiskWithProjects.length} at-risk client${atRiskWithProjects.length === 1 ? "" : "s"} with active delivery`,
      severity: "high",
      impact:
        "Delivery friction with at-risk clients compounds — slow delivery feeds payment delays and churn.",
      resolution:
        "Prioritize at-risk client deliverables and confirm expectations in a progress review.",
    })
  }

  if (projects.completed === 0 && projects.total > 0) {
    bottlenecks.push({
      type: "no_completed_project_bottleneck",
      title: "No completed projects on record",
      severity: "medium",
      impact:
        "Without completed projects there are no case studies, testimonials, or final invoices.",
      resolution:
        "Pick the project closest to done and push it to completion this week.",
    })
  }

  // ---------------------------------------------------------------------------
  // Risks.
  // ---------------------------------------------------------------------------
  const risks: CooRisk[] = []

  if (projects.overdue > 0 || completionRisk === "high") {
    risks.push({
      type: "delivery_risk",
      title: `Delivery slipping: ${projects.overdue} project${projects.overdue === 1 ? "" : "s"} past due`,
      severity: projects.overdue > 1 ? "critical" : "high",
      impact:
        "Late delivery delays revenue recognition and damages referral potential.",
      mitigation:
        "Escalate overdue projects with a recovery plan and client communication.",
    })
  }

  if (
    operations.operationalLoad >= HIGH_LOAD_THRESHOLD ||
    tasks.open > HIGH_OPEN_TASK_THRESHOLD
  ) {
    risks.push({
      type: "capacity_risk",
      title: `Operational load at ${operations.operationalLoad}/100`,
      severity: operations.operationalLoad >= 85 ? "high" : "medium",
      impact:
        "Capacity strain precedes missed deadlines — new commitments will slip before existing ones recover.",
      mitigation:
        "Freeze new delivery commitments until open work drops below capacity.",
    })
  }

  if (clientIntel.summary.atRiskClients > 0 || atRiskWithProjects.length > 0) {
    risks.push({
      type: "client_trust_risk",
      title: `${clientIntel.summary.atRiskClients} client relationship${clientIntel.summary.atRiskClients === 1 ? "" : "s"} at risk`,
      severity: "high",
      impact:
        "At-risk relationships convert delivery issues into churn and collection problems.",
      mitigation:
        "Run the next-best-action per at-risk client from the client intelligence board.",
    })
  }

  if (automation.summary.highPriority >= 4) {
    risks.push({
      type: "execution_risk",
      title: `${automation.summary.highPriority} high-priority actions awaiting execution`,
      severity: "medium",
      impact:
        "A growing queue of unactioned high-priority proposals means intelligence is outpacing execution.",
      mitigation:
        "Review the automation actions board and approve or reject every high-priority proposal this week.",
    })
  }

  // ---------------------------------------------------------------------------
  // Opportunities.
  // ---------------------------------------------------------------------------
  const opportunities: CooOpportunity[] = []

  if (projects.completed > 0 || projects.active > 0) {
    opportunities.push({
      type: "delivery_systemization",
      title: "Systemize delivery workflow",
      value: round2(projects.totalValueAud * 0.1),
      action:
        "Turn the strongest completed delivery into a repeatable checklist — faster delivery raises effective capacity.",
    })
  }

  if (tasks.open > 0) {
    opportunities.push({
      type: "task_cleanup",
      title: `Triage ${tasks.open} open task${tasks.open === 1 ? "" : "s"}`,
      value: round2(tasks.open * 50),
      action:
        "Close stale tasks and batch small ones — reclaims focus for revenue-bearing work.",
    })
  }

  if (clientIntel.summary.healthyClients > 0) {
    opportunities.push({
      type: "client_review",
      title: `Run reviews with ${clientIntel.summary.healthyClients} healthy client${clientIntel.summary.healthyClients === 1 ? "" : "s"}`,
      value: round2(clientIntel.summary.totalRevenue * 0.25),
      action:
        "Progress reviews with healthy clients surface expansion scope and referrals.",
    })
  }

  if (projects.active > 0 || projects.overdue > 0) {
    opportunities.push({
      type: "project_completion_push",
      title: "Push nearest project to completion",
      value: round2(snapshot.invoices.outstandingAud),
      action:
        "Completing the closest-to-done project unlocks final invoicing and a case study.",
    })
  }

  opportunities.sort((a, b) => b.value - a.value)

  // ---------------------------------------------------------------------------
  // Operations health score.
  // ---------------------------------------------------------------------------
  const positive =
    Math.min(tasks.completed * 2, 10) +
    (projects.active > 0 && projects.overdue === 0 ? 8 : 0) +
    Math.min(clientIntel.summary.healthyClients * 3, 9) +
    (operations.operationalLoad < 50 ? 6 : 0) +
    (tasks.overdue === 0 ? 5 : 0)

  const negative =
    projects.overdue * 8 +
    Math.max(0, tasks.open - HIGH_OPEN_TASK_THRESHOLD) * 2 +
    clientIntel.summary.atRiskClients * 6 +
    (projects.completed === 0 && projects.total > 0 ? 6 : 0) +
    bottlenecks.length * 3

  const operationsHealth = Math.round(clamp(50 + positive - negative, 0, 100))

  // ---------------------------------------------------------------------------
  // Top 5 COO recommendations — deterministic priority order.
  // ---------------------------------------------------------------------------
  const recommendations: string[] = []

  if (projects.overdue > 0) {
    recommendations.push(
      `Resolve ${projects.overdue} overdue project${projects.overdue === 1 ? "" : "s"} before starting new delivery work.`
    )
  }

  if (tasks.open > HIGH_OPEN_TASK_THRESHOLD || tasks.highPriority >= 3) {
    recommendations.push(
      "Run a weekly task triage — cap work-in-progress and keep the high-priority flag for client-blocking items only."
    )
  }

  if (projects.completed === 0 && projects.total > 0) {
    recommendations.push(
      "Push the closest-to-done project to completion to unlock final invoicing and a case study."
    )
  }

  if (clientIntel.summary.healthyClients > 0) {
    recommendations.push(
      "Schedule progress reviews with every healthy client — reviews protect delivery health and surface expansion scope."
    )
  }

  if (automation.summary.highPriority > 0) {
    recommendations.push(
      `Clear the automation queue: ${automation.summary.highPriority} high-priority proposed action${automation.summary.highPriority === 1 ? "" : "s"} await review.`
    )
  }

  if (recommendations.length < 5) {
    recommendations.push(
      "Document the delivery workflow as a checklist — systemized delivery raises capacity without new hires."
    )
  }

  if (recommendations.length < 5) {
    recommendations.push(
      "Hold a weekly operations review tracking operational load, overdue work, and delivery capacity."
    )
  }

  const coo: CooIntelligence = {
    operationsHealth,
    deliveryHealth,
    workloadHealth,
    projectForecast,
    taskForecast,
    bottlenecks,
    risks,
    opportunities,
    recommendations: recommendations.slice(0, 5),
    generatedAt: now.toISOString(),
  }

  // Fire-and-forget: persistence never blocks or fails the response.
  void storeCooSnapshot(coo)

  return coo
}
