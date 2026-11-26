import type { ExecutivePlatformSnapshot } from "@/lib/executive/platform-snapshot"
import { prisma } from "@/lib/prisma"
import { ReasoningChain, computeEvidenceConfidence, buildReasoning } from './evidence-confidence';

export type ExecutiveActionPayload = Record<string, unknown>

export type ExecutiveRecommendation = {
  title: string
  reason: string
  suggestedAction: string
  priority: "urgent" | "high" | "medium" | "low"
  link?: string
  actionType?: string
  actionPayload?: ExecutiveActionPayload
}

export type ExecutiveRecommendations = {
  urgent: ExecutiveRecommendation[]
  today: ExecutiveRecommendation[]
  thisWeek: ExecutiveRecommendation[]
  growth: ExecutiveRecommendation[]
  revenue: ExecutiveRecommendation[]
  delivery: ExecutiveRecommendation[]
  content: ExecutiveRecommendation[]
}

function formatAud(value: number) {
  return `AUD ${value.toLocaleString("en-AU")}`
}

function item(
  title: string,
  reason: string,
  suggestedAction: string,
  priority: ExecutiveRecommendation["priority"],
  link?: string,
  actionType?: string,
  actionPayload?: ExecutiveActionPayload
): ExecutiveRecommendation {
  const recommendation: ExecutiveRecommendation = {
    title,
    reason,
    suggestedAction,
    priority,
    link,
  }

  if (actionType) {
    recommendation.actionType = actionType
    recommendation.actionPayload = actionPayload
  } else if (link) {
    recommendation.actionType = "open-page"
    recommendation.actionPayload = { url: link }
  }

  return recommendation
}

export function buildExecutiveRecommendations(
  snapshot: ExecutivePlatformSnapshot
): ExecutiveRecommendations {
  const urgent: ExecutiveRecommendation[] = []
  const today: ExecutiveRecommendation[] = []
  const thisWeek: ExecutiveRecommendation[] = []
  const growth: ExecutiveRecommendation[] = []
  const revenue: ExecutiveRecommendation[] = []
  const delivery: ExecutiveRecommendation[] = []
  const content: ExecutiveRecommendation[] = []

  if (snapshot.overdueTasks > 0) {
    urgent.push(
      item(
        "Overdue delivery tasks",
        `${snapshot.overdueTasks} client task${snapshot.overdueTasks === 1 ? "" : "s"} are past due.`,
        "Open client projects and clear overdue deliverables today.",
        "urgent",
        "/admin/client-projects"
      )
    )
  }

  if (snapshot.overdueInvoices > 0) {
    urgent.push(
      item(
        "Overdue invoices",
        `${snapshot.overdueInvoices} invoice${snapshot.overdueInvoices === 1 ? "" : "s"} need payment follow-up.`,
        "Review overdue invoices and contact clients immediately.",
        "urgent",
        "/admin/invoices"
      )
    )
  }

  if (snapshot.reviewRequiredCount > 0) {
    urgent.push(
      item(
        "Editorial review backlog",
        `${snapshot.reviewRequiredCount} article${snapshot.reviewRequiredCount === 1 ? "" : "s"} waiting for review.`,
        "Approve or reject review-required articles before publishing stalls.",
        "urgent",
        "/admin/articles"
      )
    )
  }

  if (snapshot.deliveryHealthScore < 70) {
    urgent.push(
      item(
        "Delivery health is at risk",
        `Delivery health score is ${snapshot.deliveryHealthScore} (below 70).`,
        "Review delivery intelligence and resolve overdue work.",
        "urgent",
        "/admin/delivery-intelligence"
      )
    )
  }

  for (const article of snapshot.reviewRequiredArticles) {
    today.push(
      item(
        `Review: ${article.title}`,
        "Article is in review-required status.",
        "Review, approve, or send back for edits.",
        "high",
        "/admin/articles"
      )
    )
  }

  for (const lead of snapshot.hotLeads) {
    today.push(
      item(
        `Follow up hot lead: ${lead.name}`,
        `Lead score ${lead.leadScore} indicates high intent.`,
        "Mark the lead as contacted after follow-up.",
        "high",
        "/admin/creator-leads",
        "mark-lead-contacted",
        { leadId: lead.id }
      )
    )
  }

  for (const lead of snapshot.proposalReadyLeads) {
    today.push(
      item(
        `Send proposal: ${lead.name}`,
        "Lead is marked proposal-ready.",
        "Generate or send the proposal and move to proposal-sent.",
        "high",
        "/admin/creator-leads"
      )
    )
  }

  for (const invoice of snapshot.overdueInvoiceItems) {
    today.push(
      item(
        `Chase invoice ${invoice.invoiceNumber}`,
        `Outstanding amount ${formatAud(invoice.amountAud)} is overdue.`,
        "Mark invoice overdue and follow up with the client.",
        "high",
        "/admin/invoices",
        "mark-invoice-overdue",
        { invoiceId: invoice.id }
      )
    )
  }

  for (const project of snapshot.dueSoonProjects) {
    today.push(
      item(
        `Project due soon: ${project.title}`,
        `Due within 7 days at ${project.progressPercent}% complete.`,
        "Create a follow-up task to close remaining deliverables.",
        "high",
        "/admin/client-projects",
        "create-follow-up-task",
        {
          projectId: project.id,
          title: `Close out: ${project.title}`,
          description:
            "Executive follow-up task for project due within 7 days.",
          priority: "high",
        }
      )
    )
  }

  if (snapshot.scheduledCount === 0) {
    thisWeek.push(
      item(
        "No scheduled content",
        "There are no articles scheduled for publishing.",
        "Create or schedule at least one article for the week ahead.",
        "medium",
        "/admin/planner"
      )
    )
  }

  if (snapshot.openPipeline > 0) {
    thisWeek.push(
      item(
        "Follow up open pipeline",
        `Open pipeline value is ${formatAud(snapshot.openPipeline)}.`,
        "Advance active deals through the CRM pipeline this week.",
        "medium",
        "/admin/creator-leads"
      )
    )
  }

  if (snapshot.leadMagnetCount <= 1) {
    thisWeek.push(
      item(
        "Expand lead magnet library",
        snapshot.leadMagnetCount === 0
          ? "No lead magnets exist yet."
          : "Only one lead magnet is available.",
        "Create another lead magnet to diversify subscriber acquisition.",
        "medium",
        "/admin/lead-magnets"
      )
    )
  }

  if (snapshot.openTasks > 0) {
    thisWeek.push(
      item(
        "Complete active project tasks",
        `${snapshot.openTasks} open task${snapshot.openTasks === 1 ? "" : "s"} across client projects.`,
        "Block time this week to close open deliverables.",
        "medium",
        "/admin/client-projects"
      )
    )
  }

  if (snapshot.totalSubscribers < 50) {
    growth.push(
      item(
        "Grow subscriber list",
        `Only ${snapshot.totalSubscribers} subscriber${snapshot.totalSubscribers === 1 ? "" : "s"} on the list.`,
        "Promote newsletter signup across site, blog, and social channels.",
        "medium",
        "/admin/growth"
      )
    )
  }

  if (snapshot.leadMagnetSubscribers > 0) {
    growth.push(
      item(
        "Scale lead magnet acquisition",
        `${snapshot.leadMagnetSubscribers} lead magnet subscriber${snapshot.leadMagnetSubscribers === 1 ? "" : "s"} captured.`,
        "Add more blog CTAs and promote lead magnets in published content.",
        "medium",
        "/admin/lead-magnets"
      )
    )
  }

  if (snapshot.blogCtaSubscribers > 0) {
    growth.push(
      item(
        "Expand article CTA strategy",
        `${snapshot.blogCtaSubscribers} subscriber${snapshot.blogCtaSubscribers === 1 ? "" : "s"} came from blog CTAs.`,
        "Replicate high-performing blog CTA patterns across more articles.",
        "medium",
        "/admin/articles"
      )
    )
  }

  if (snapshot.openPipeline > 0) {
    revenue.push(
      item(
        "Pipeline follow-up",
        `Open pipeline value ${formatAud(snapshot.openPipeline)}.`,
        "Contact leads in new, contacted, and proposal-sent stages.",
        "high",
        "/admin/creator-leads"
      )
    )
  }

  if (snapshot.proposalReadyLeads.length > 0) {
    revenue.push(
      item(
        "Send pending proposals",
        `${snapshot.proposalReadyLeads.length} lead${snapshot.proposalReadyLeads.length === 1 ? "" : "s"} ready for proposal.`,
        "Generate and send proposals to unlock revenue.",
        "high",
        "/admin/proposals"
      )
    )
  }

  if (snapshot.outstandingRevenue > 0) {
    revenue.push(
      item(
        "Invoice payment follow-up",
        `Outstanding revenue ${formatAud(snapshot.outstandingRevenue)}.`,
        "Follow up on sent invoices and mark status after payment.",
        "high",
        "/admin/invoices"
      )
    )
  }

  for (const task of snapshot.overdueTaskItems) {
    delivery.push(
      item(
        `Overdue task: ${task.title}`,
        "Task due date has passed.",
        "Create a follow-up task or complete the deliverable.",
        "urgent",
        "/admin/client-projects",
        "create-follow-up-task",
        {
          projectId: task.projectId,
          title: `Follow up: ${task.title}`,
          description: "Executive follow-up task for overdue deliverable.",
          priority: "high",
        }
      )
    )
  }

  for (const project of snapshot.atRiskProjects) {
    delivery.push(
      item(
        `At-risk project: ${project.title}`,
        `Only ${project.progressPercent}% complete with deadline approaching.`,
        "Review delivery intelligence and reallocate focus.",
        "high",
        "/admin/delivery-intelligence"
      )
    )
  }

  for (const project of snapshot.readyToCompleteProjects) {
    delivery.push(
      item(
        `Mark project completed: ${project.title}`,
        "All tasks are done but project status is still active.",
        "Mark the project as completed and plan follow-up engagement.",
        "medium",
        "/admin/client-projects",
        "mark-project-completed",
        { projectId: project.id }
      )
    )
  }

  if (snapshot.reviewRequiredCount > 0) {
    content.push(
      item(
        "Clear review queue",
        `${snapshot.reviewRequiredCount} article${snapshot.reviewRequiredCount === 1 ? "" : "s"} need review.`,
        "Process the editorial review queue.",
        "high",
        "/admin/articles"
      )
    )
  }

  if (snapshot.scheduledCount === 0) {
    content.push(
      item(
        "Schedule publishing pipeline",
        "No articles are scheduled.",
        "Schedule drafts to maintain consistent publishing.",
        "medium",
        "/admin/scheduled"
      )
    )
  } else {
    content.push(
      item(
        "Scheduled content on track",
        `${snapshot.scheduledCount} article${snapshot.scheduledCount === 1 ? "" : "s"} scheduled.`,
        "Review scheduled content and confirm publish dates.",
        "low",
        "/admin/scheduled"
      )
    )
  }

  if (snapshot.draftCount > 0) {
    content.push(
      item(
        "Move drafts forward",
        `${snapshot.draftCount} draft${snapshot.draftCount === 1 ? "" : "s"} waiting.`,
        "Edit drafts and move the best ones into review or scheduling.",
        "medium",
        "/admin/articles"
      )
    )
  }

  return {
    urgent,
    today,
    thisWeek,
    growth,
    revenue,
    delivery,
    content,
  }
}

// ---------------------------------------------------------------------------
// Phase 19 — Executive Intelligence Engine (rule-based, deterministic)
// ---------------------------------------------------------------------------

export type ExecutiveIntelligenceRecommendation = {
  title: string
  priority: "low" | "medium" | "high" | "critical"
  category: string
  rationale: string
  action: string
  confidence: number
  evidenceIds?: string[]
  reasoning: ReasoningChain
  confidenceMemory: { adjustedConfidence: number; adjustmentReason: string } | null
}

const INTELLIGENCE_PRIORITY_RANK: Record<
  ExecutiveIntelligenceRecommendation["priority"],
  number
> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const ACTIVE_PROJECT_STATUSES = ["active", "planned", "in_progress"]
const OPEN_LEAD_STATUSES = ["new", "engaged", "qualified", "contacted"]

/**
 * Rule-based executive recommendations derived from goals, initiatives,
 * decisions, leads, projects, and revenue. Deterministic — no AI calls.
 */
export async function generateExecutiveRecommendations(): Promise<
  ExecutiveIntelligenceRecommendation[]
> {
  try {
    const now = new Date()

    const [
      goals,
      initiatives,
      decisions,
      leads,
      proposals,
      projects,
      tasks,
      invoices,
    ] = await Promise.all([
      prisma.quarterlyGoal.findMany(),
      prisma.strategicInitiative.findMany(),
      prisma.executiveDecision.findMany(),
       prisma.creatorLead.findMany({ where: { isTest: false } }),
      prisma.creatorProposal.findMany({ where: { isTest: false } }),
      prisma.clientProject.findMany({ where: { isTest: false } }),
      prisma.clientProjectTask.findMany({ where: { isTest: false } }),
      prisma.clientInvoice.findMany({ where: { isTest: false } }),
    ])

    const recommendations: ExecutiveIntelligenceRecommendation[] = []

    // High-score leads without a proposal → create proposal.
    const leadIdsWithProposals = new Set(
      proposals.filter((p) => p.leadId).map((p) => p.leadId as string)
    )

    for (const lead of leads) {
      if (
        lead.leadScore > 80 &&
        OPEN_LEAD_STATUSES.includes(lead.status) &&
        !leadIdsWithProposals.has(lead.id)
      ) {
        const leadRecEc = computeEvidenceConfidence({
          evidenceIds: [lead.id, `lead-score-${lead.leadScore}`],
          sourceCount: 2,
          timestampMs: new Date(lead.updatedAt).getTime(),
        })
        recommendations.push({
          title: `Create proposal for ${lead.name}`,
          priority: "high",
          category: "revenue",
          rationale: `Lead score ${lead.leadScore} with no proposal on record.`,
          action: `Draft and send a proposal to ${lead.name} (${lead.email}).`,
          confidence: leadRecEc.score,
          evidenceIds: [lead.id],
          confidenceMemory: null,
          reasoning: buildReasoning({
            summary: `Lead ${lead.name} has score ${lead.leadScore} with no proposal on record`,
            evidenceIds: [lead.id],
            confidenceScore: leadRecEc.score,
            sourceCount: 2,
            dataFreshnessHours: (Date.now() - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60),
            missingEvidence: [],
            hasConflictingEvidence: false,
            decisionFactors: ['High-value lead detection', `Score threshold: 80`, 'No existing proposal check'],
          }),
        })
      } else if (
        lead.readiness === "hot" &&
        OPEN_LEAD_STATUSES.includes(lead.status) &&
        !leadIdsWithProposals.has(lead.id)
      ) {
        const hotLeadEc = computeEvidenceConfidence({
          evidenceIds: [lead.id, `lead-readiness-${lead.readiness}`],
          sourceCount: 1,
          timestampMs: new Date(lead.updatedAt).getTime(),
        })
        recommendations.push({
          title: `Follow up with hot lead ${lead.name}`,
          priority: "medium",
          category: "revenue",
          rationale: `Lead readiness is hot but no proposal exists yet.`,
          action: `Book a call with ${lead.name} and qualify for a proposal.`,
          confidence: hotLeadEc.score,
          evidenceIds: [lead.id],
          confidenceMemory: null,
          reasoning: buildReasoning({
            summary: `Lead ${lead.name} readiness is hot with no proposal`,
            evidenceIds: [lead.id],
            confidenceScore: hotLeadEc.score,
            sourceCount: 1,
            dataFreshnessHours: (Date.now() - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60),
            missingEvidence: [],
            hasConflictingEvidence: false,
            decisionFactors: ['Hot readiness detection', 'No existing proposal guard', `Readiness: ${lead.readiness}`],
          }),
        })
      }
    }

    // Overdue projects → escalate.
    for (const project of projects) {
      if (
        project.dueDate &&
        project.dueDate < now &&
        ACTIVE_PROJECT_STATUSES.includes(project.status)
      ) {
        const projectEc = computeEvidenceConfidence({
          evidenceIds: [project.id, `project-status-${project.status}`],
          sourceCount: 2,
          timestampMs: new Date(project.updatedAt).getTime(),
        })
        recommendations.push({
          title: `Escalate overdue project: ${project.title}`,
          priority: "critical",
          category: "delivery",
          rationale: `Project due ${project.dueDate.toISOString().slice(0, 10)} is still ${project.status}.`,
          action: `Review scope and timeline for "${project.title}" and notify the client.`,
          confidence: projectEc.score,
          evidenceIds: [project.id],
          confidenceMemory: null,
          reasoning: buildReasoning({
            summary: `Project ${project.title} is overdue (due ${project.dueDate.toISOString().slice(0, 10)})`,
            evidenceIds: [project.id],
            confidenceScore: projectEc.score,
            sourceCount: 2,
            dataFreshnessHours: (Date.now() - new Date(project.updatedAt).getTime()) / (1000 * 60 * 60),
            missingEvidence: [],
            hasConflictingEvidence: false,
            decisionFactors: ['Overdue detection', `Status: ${project.status}`, `Due date: ${project.dueDate.toISOString().slice(0, 10)}`],
          }),
        })
      }
    }

    // Overdue tasks → unblock delivery.
    const overdueTasks = tasks.filter(
      (task) => task.dueDate && task.dueDate < now && task.status !== "done"
    )

    if (overdueTasks.length > 0) {
      const overdueTasksEc = computeEvidenceConfidence({
        evidenceIds: overdueTasks.map((t) => t.id),
        sourceCount: overdueTasks.length > 3 ? 3 : overdueTasks.length,
        timestampMs: overdueTasks.length > 0 ? new Date(overdueTasks[0].updatedAt).getTime() : Date.now(),
      })
      recommendations.push({
        title: `Clear ${overdueTasks.length} overdue delivery task${overdueTasks.length === 1 ? "" : "s"}`,
        priority: "high",
        category: "delivery",
        rationale: `${overdueTasks.length} client task${overdueTasks.length === 1 ? " is" : "s are"} past due.`,
        action: "Reprioritize the delivery queue and reassign blocked tasks.",
        confidence: overdueTasksEc.score,
        evidenceIds: overdueTasks.map((t) => t.id),
        confidenceMemory: null,
        reasoning: buildReasoning({
          summary: `${overdueTasks.length} delivery task${overdueTasks.length === 1 ? "" : "s"} past due`,
          evidenceIds: overdueTasks.map((t) => t.id),
          confidenceScore: overdueTasksEc.score,
          sourceCount: overdueTasksEc.sourceCount,
          dataFreshnessHours: overdueTasksEc.dataFreshnessHours,
          missingEvidence: overdueTasksEc.missingEvidence,
          hasConflictingEvidence: overdueTasksEc.hasConflictingEvidence,
          decisionFactors: ['Task completion audit', 'Delivery queue analysis', `Overdue count: ${overdueTasks.length}`],
        }),
      })
    }

    // Low-progress active goals → strategic review.
    for (const goal of goals) {
      if (goal.status === "active" && goal.progress < 25) {
        const goalRecEc = computeEvidenceConfidence({
          evidenceIds: [goal.id, `goal-progress-${goal.progress}`],
          sourceCount: 1,
          timestampMs: new Date(goal.updatedAt).getTime(),
        })
        recommendations.push({
          title: `Strategic review: ${goal.title}`,
          priority: "medium",
          category: "strategy",
          rationale: `Goal progress is ${goal.progress}% for ${goal.quarter} ${goal.year}.`,
          action: `Run a strategic review of "${goal.title}" and adjust supporting initiatives.`,
          confidence: goalRecEc.score,
          evidenceIds: [goal.id],
          confidenceMemory: null,
          reasoning: buildReasoning({
            summary: `Goal "${goal.title}" at ${goal.progress}% progress needs strategic review`,
            evidenceIds: [goal.id],
            confidenceScore: goalRecEc.score,
            sourceCount: 1,
            dataFreshnessHours: (Date.now() - new Date(goal.updatedAt).getTime()) / (1000 * 60 * 60),
            missingEvidence: [],
            hasConflictingEvidence: false,
            decisionFactors: ['Strategic goal monitoring', `Progress threshold: <25%`, `Current: ${goal.progress}%`, `Quarter: ${goal.quarter} ${goal.year}`],
          }),
        })
      }
    }

    // Stalled in-progress initiatives → review execution path.
    for (const initiative of initiatives) {
      if (initiative.status === "in_progress" && initiative.progress < 25) {
        const initiativeEc = computeEvidenceConfidence({
          evidenceIds: [initiative.id, `initiative-progress-${initiative.progress}`],
          sourceCount: 1,
          timestampMs: new Date(initiative.updatedAt).getTime(),
        })
        recommendations.push({
          title: `Unblock initiative: ${initiative.title}`,
          priority: "medium",
          category: "execution",
          rationale: `Initiative is in progress but only ${initiative.progress}% complete.`,
          action: `Review the execution path for "${initiative.title}" and remove blockers.`,
          confidence: initiativeEc.score,
          evidenceIds: [initiative.id],
          confidenceMemory: null,
          reasoning: buildReasoning({
            summary: `Initiative "${initiative.title}" stalled at ${initiative.progress}% progress`,
            evidenceIds: [initiative.id],
            confidenceScore: initiativeEc.score,
            sourceCount: 1,
            dataFreshnessHours: (Date.now() - new Date(initiative.updatedAt).getTime()) / (1000 * 60 * 60),
            missingEvidence: [],
            hasConflictingEvidence: false,
            decisionFactors: ['Execution monitoring', `Progress threshold: <25%`, `Current: ${initiative.progress}%`, `Status: ${initiative.status}`],
          }),
        })
      }
    }

    // Overdue invoices → revenue risk.
    for (const invoice of invoices) {
      if (
        invoice.status !== "paid" &&
        invoice.dueDate &&
        invoice.dueDate < now
      ) {
        const invoiceRecEc = computeEvidenceConfidence({
          evidenceIds: [invoice.id, `invoice-status-${invoice.status}`],
          sourceCount: 2,
          timestampMs: new Date(invoice.updatedAt).getTime(),
        })
        recommendations.push({
          title: `Chase overdue invoice ${invoice.invoiceNumber}`,
          priority: "critical",
          category: "revenue",
          rationale: `Invoice ${invoice.invoiceNumber} (AUD ${invoice.amountAud.toLocaleString("en-AU")}) is past due.`,
          action: `Send a payment reminder for ${invoice.invoiceNumber} and confirm payment terms.`,
          confidence: invoiceRecEc.score,
          evidenceIds: [invoice.id],
          confidenceMemory: null,
          reasoning: buildReasoning({
            summary: `Invoice ${invoice.invoiceNumber} is overdue (AUD ${invoice.amountAud.toLocaleString("en-AU")})`,
            evidenceIds: [invoice.id],
            confidenceScore: invoiceRecEc.score,
            sourceCount: 2,
            dataFreshnessHours: (Date.now() - new Date(invoice.updatedAt).getTime()) / (1000 * 60 * 60),
            missingEvidence: [],
            hasConflictingEvidence: false,
            decisionFactors: ['Revenue risk detection', `Status: ${invoice.status}`, `Due date: ${invoice.dueDate?.toISOString().slice(0, 10)}`],
          }),
        })
      }
    }

    // Decisions flagged for follow-up → schedule review.
    const followUps = decisions.filter(
      (decision) => decision.followUpRequired && !decision.reviewDate
    )

    if (followUps.length > 0) {
      const followUpsEc = computeEvidenceConfidence({
        evidenceIds: followUps.map((d) => d.id),
        sourceCount: followUps.length > 2 ? 3 : followUps.length,
        timestampMs: followUps.length > 0 ? new Date(followUps[0].updatedAt).getTime() : Date.now(),
      })
      recommendations.push({
        title: `Schedule follow-up for ${followUps.length} executive decision${followUps.length === 1 ? "" : "s"}`,
        priority: "low",
        category: "governance",
        rationale: `${followUps.length} decision${followUps.length === 1 ? "" : "s"} require follow-up but have no review date.`,
        action: "Set review dates and add the decisions to the next boardroom agenda.",
        confidence: followUpsEc.score,
        evidenceIds: followUps.map((d) => d.id),
        confidenceMemory: null,
        reasoning: buildReasoning({
          summary: `${followUps.length} executive decision${followUps.length === 1 ? "" : "s"} require follow-up without a review date`,
          evidenceIds: followUps.map((d) => d.id),
          confidenceScore: followUpsEc.score,
          sourceCount: followUpsEc.sourceCount,
          dataFreshnessHours: followUpsEc.dataFreshnessHours,
          missingEvidence: followUpsEc.missingEvidence,
          hasConflictingEvidence: followUpsEc.hasConflictingEvidence,
          decisionFactors: ['Governance compliance', 'Follow-up requirement detection', `Missing review dates: ${followUps.length}`],
        }),
      })
    }

    return recommendations.sort(
      (a, b) =>
        INTELLIGENCE_PRIORITY_RANK[a.priority] -
          INTELLIGENCE_PRIORITY_RANK[b.priority] ||
        b.confidence - a.confidence ||
        a.title.localeCompare(b.title)
    )
  } catch (error) {
    console.error("Executive recommendations engine failed:", error)
    return []
  }
}
