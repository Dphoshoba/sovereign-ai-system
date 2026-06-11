import { getBusinessSnapshot } from "@/lib/business/business-data-layer"
import { buildBusinessMemory } from "@/lib/executive/business-memory"
import { buildClientIntelligence } from "@/lib/executive/client-intelligence"
import { generateExecutiveLearning } from "@/lib/executive/learning-engine"
import { buildRevenueIntelligence } from "@/lib/executive/revenue-intelligence"
import { generateExecutiveRisks } from "@/lib/executive/risks"
import { prisma } from "@/lib/prisma"

// Phase 30 — Executive Automation Engine.
// Generates SAFE, deterministic proposed actions from business, client,
// revenue, governance, and learning intelligence. Never sends emails,
// charges invoices, publishes content, deletes data, or makes any
// irreversible change — every action is a proposal for human review.

export type AutomationCategory =
  | "Revenue"
  | "Client"
  | "Delivery"
  | "Growth"
  | "Governance"
  | "Operations"

export type AutomationPriority = "low" | "medium" | "high" | "critical"

export type AutomationStatus =
  | "proposed"
  | "approved"
  | "rejected"
  | "completed"

export type AutomationSafetyLevel =
  | "safe_review"
  | "safe_create_task"
  | "approval_required"
  | "manual_only"

export type AutomationAction = {
  id: string
  title: string
  category: AutomationCategory
  priority: AutomationPriority
  trigger: string
  rationale: string
  recommendedAction: string
  targetType: string
  targetId: string
  status: AutomationStatus
  safetyLevel: AutomationSafetyLevel
  requiresApproval: boolean
  link: string
}

export type AutomationSummary = {
  total: number
  byPriority: Record<AutomationPriority, number>
  byCategory: Record<AutomationCategory, number>
  bySafetyLevel: Record<AutomationSafetyLevel, number>
  approvalRequired: number
  manualOnly: number
  highPriority: number
}

export type ExecutiveAutomation = {
  actions: AutomationAction[]
  summary: AutomationSummary
  generatedAt: string
}

const QUERY_LIMIT = 50
const LOW_SUBSCRIBER_THRESHOLD = 100
const HIGH_OPEN_TASK_THRESHOLD = 10
const HIGH_VALUE_LEAD_SCORE = 80
const STALE_DECISION_DAYS = 30

const PRIORITY_RANK: Record<AutomationPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

function requiresApproval(safetyLevel: AutomationSafetyLevel) {
  return safetyLevel === "approval_required" || safetyLevel === "manual_only"
}

function makeAction(
  input: Omit<AutomationAction, "status" | "requiresApproval">
): AutomationAction {
  return {
    ...input,
    status: "proposed",
    requiresApproval: requiresApproval(input.safetyLevel),
  }
}

/** Best-effort daily snapshot persistence — never fails the caller. */
async function storeAutomationSnapshot(automation: ExecutiveAutomation) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const title = `Automation Actions Snapshot ${today}`

    const content = JSON.stringify({
      summary: automation.summary,
      actions: automation.actions.map((action) => ({
        id: action.id,
        title: action.title,
        category: action.category,
        priority: action.priority,
        safetyLevel: action.safetyLevel,
      })),
    })

    const existing = await prisma.aiMemory.findFirst({
      where: { type: "automation-actions-snapshot", title },
    })

    if (existing) {
      await prisma.aiMemory.update({
        where: { id: existing.id },
        data: { content },
      })
    } else {
      await prisma.aiMemory.create({
        data: {
          type: "automation-actions-snapshot",
          title,
          content,
          source: "automation-engine",
          tags: "executive,automation,actions,snapshot",
        },
      })
    }
  } catch (error) {
    console.error("Failed to store automation snapshot:", error)
  }
}

export async function generateExecutiveAutomationActions(): Promise<ExecutiveAutomation> {
  const now = new Date()

  // Shared inputs, fetched once and reused across engines (production safe).
  const snapshot = await getBusinessSnapshot()
  const memory = await buildBusinessMemory({ snapshot })

  const [
    revenue,
    clientIntel,
    learning,
    risks,
    decisions,
    leads,
    proposals,
    subscriberCount,
  ] = await Promise.all([
    buildRevenueIntelligence({ snapshot, memory }),
    buildClientIntelligence({ snapshot }),
    generateExecutiveLearning({ lightweight: true, skipPersistence: true }),
    generateExecutiveRisks(),
    prisma.executiveDecision.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
      },
    }),
    prisma.creatorLead.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
      select: {
        id: true,
        name: true,
        status: true,
        leadScore: true,
        projectedValue: true,
      },
    }),
    prisma.creatorProposal.findMany({
      orderBy: { createdAt: "desc" },
      take: QUERY_LIMIT,
      select: { leadId: true, status: true, title: true },
    }),
    prisma.newsletterSubscriber
      .count({ where: { status: "active" } })
      .catch(() => 0),
  ])

  const actions: AutomationAction[] = []

  // ---------------------------------------------------------------------------
  // Revenue rules.
  // ---------------------------------------------------------------------------
  if (revenue.outstandingRevenue > 0) {
    actions.push(
      makeAction({
        id: "auto-revenue-collections",
        title: "Run collections follow-up",
        category: "Revenue",
        priority: revenue.collectionRate < 50 ? "high" : "medium",
        trigger: `$${revenue.outstandingRevenue.toLocaleString()} AUD in outstanding invoices`,
        rationale:
          "Outstanding invoices are the fastest revenue available — no new delivery work required.",
        recommendedAction:
          "Create follow-up tasks for every unpaid invoice and send payment reminders after approval.",
        targetType: "client_invoice",
        targetId: "outstanding",
        safetyLevel: "approval_required",
        link: "/admin/invoices",
      })
    )
  }

  if (
    revenue.collectionRate < 50 &&
    revenue.collectedRevenue + revenue.outstandingRevenue > 0
  ) {
    actions.push(
      makeAction({
        id: "auto-revenue-review",
        title: "Hold revenue review",
        category: "Revenue",
        priority: "high",
        trigger: `Collection rate at ${revenue.collectionRate}%`,
        rationale:
          "Less than half of invoiced revenue has been collected — payment terms and invoicing cadence need review.",
        recommendedAction:
          "Schedule a revenue review covering payment terms, deposits, and milestone invoicing.",
        targetType: "revenue",
        targetId: "collection-rate",
        safetyLevel: "safe_review",
        link: "/admin/revenue-intelligence",
      })
    )
  }

  if (snapshot.proposals.sent > 0) {
    actions.push(
      makeAction({
        id: "auto-revenue-proposal-followup",
        title: `Follow up ${snapshot.proposals.sent} sent proposal${snapshot.proposals.sent === 1 ? "" : "s"}`,
        category: "Revenue",
        priority: "medium",
        trigger: `${snapshot.proposals.sent} proposal${snapshot.proposals.sent === 1 ? "" : "s"} awaiting client response`,
        rationale:
          "Sent proposals convert best with a follow-up within 48 hours of delivery.",
        recommendedAction:
          "Create a follow-up task per sent proposal with a specific next step and start date.",
        targetType: "creator_proposal",
        targetId: "sent",
        safetyLevel: "safe_create_task",
        link: "/admin/proposals",
      })
    )
  }

  // ---------------------------------------------------------------------------
  // Client rules — one targeted action per client, from client intelligence.
  // ---------------------------------------------------------------------------
  for (const client of clientIntel.clients) {
    if (client.outstandingRevenue > 0) {
      actions.push(
        makeAction({
          id: `auto-client-payment-${client.clientId}`,
          title: `Payment follow-up: ${client.clientName}`,
          category: "Client",
          priority: client.riskScore >= 50 ? "high" : "medium",
          trigger: `$${client.outstandingRevenue.toLocaleString()} AUD outstanding (${client.invoiceStatus})`,
          rationale: `Client relationship is ${client.relationshipStatus.toLowerCase()}; unpaid balance is the primary account risk.`,
          recommendedAction: client.nextBestAction,
          targetType: "client",
          targetId: client.clientId,
          safetyLevel: "approval_required",
          link: "/admin/client-intelligence",
        })
      )
    } else if (client.relationshipStatus === "Dormant") {
      actions.push(
        makeAction({
          id: `auto-client-reengage-${client.clientId}`,
          title: `Re-engage dormant client: ${client.clientName}`,
          category: "Client",
          priority: "medium",
          trigger: "No activity in 30+ days and no active projects",
          rationale:
            "Dormant clients are warm relationships — re-engagement costs far less than new acquisition.",
          recommendedAction:
            "Draft a check-in message with a new offer for review before sending.",
          targetType: "client",
          targetId: client.clientId,
          safetyLevel: "approval_required",
          link: "/admin/client-intelligence",
        })
      )
    } else if (client.activeProjects > 0) {
      actions.push(
        makeAction({
          id: `auto-client-review-${client.clientId}`,
          title: `Progress review: ${client.clientName}`,
          category: "Client",
          priority: "low",
          trigger: `${client.activeProjects} active project${client.activeProjects === 1 ? "" : "s"} (${client.projectStatus})`,
          rationale:
            "Regular progress reviews protect delivery health and surface expansion scope.",
          recommendedAction:
            "Schedule a progress review and capture next-phase opportunities.",
          targetType: "client",
          targetId: client.clientId,
          safetyLevel: "safe_create_task",
          link: "/admin/client-intelligence",
        })
      )
    }
  }

  // ---------------------------------------------------------------------------
  // Delivery rules.
  // ---------------------------------------------------------------------------
  if (snapshot.projects.overdue > 0) {
    actions.push(
      makeAction({
        id: "auto-delivery-escalation",
        title: `Escalate ${snapshot.projects.overdue} overdue project${snapshot.projects.overdue === 1 ? "" : "s"}`,
        category: "Delivery",
        priority: "high",
        trigger: `${snapshot.projects.overdue} project${snapshot.projects.overdue === 1 ? "" : "s"} past due date`,
        rationale:
          "Overdue projects damage client trust and delay invoicing — the learning engine flags delayed implementation as a recurring failure pattern.",
        recommendedAction:
          "Review each overdue project, set a recovery date, and notify the client with a revised plan.",
        targetType: "client_project",
        targetId: "overdue",
        safetyLevel: "safe_review",
        link: "/admin/delivery",
      })
    )

    actions.push(
      makeAction({
        id: "auto-delivery-recovery",
        title: "Create project recovery plan",
        category: "Delivery",
        priority: "medium",
        trigger: "At-risk delivery detected (overdue project with open tasks)",
        rationale:
          "A written recovery plan converts an at-risk project back into a scheduled one.",
        recommendedAction:
          "Draft a recovery plan task: remaining scope, owner, and a realistic completion date.",
        targetType: "client_project",
        targetId: "at-risk",
        safetyLevel: "safe_create_task",
        link: "/admin/delivery",
      })
    )
  }

  if (snapshot.tasks.open > HIGH_OPEN_TASK_THRESHOLD) {
    actions.push(
      makeAction({
        id: "auto-delivery-workload",
        title: "Review delivery workload",
        category: "Delivery",
        priority: "medium",
        trigger: `${snapshot.tasks.open} open tasks (${snapshot.tasks.overdue} overdue)`,
        rationale:
          "High open task count signals capacity strain before projects start slipping.",
        recommendedAction:
          "Run a workload review: close stale tasks, reprioritize, and confirm owner capacity.",
        targetType: "client_project_task",
        targetId: "open",
        safetyLevel: "safe_review",
        link: "/admin/delivery",
      })
    )
  }

  // ---------------------------------------------------------------------------
  // Growth rules.
  // ---------------------------------------------------------------------------
  const proposalLeadIds = new Set(
    proposals
      .map((proposal) => proposal.leadId)
      .filter((id): id is string => Boolean(id))
  )

  for (const lead of leads) {
    if (lead.status === "qualified") {
      actions.push(
        makeAction({
          id: `auto-growth-convert-${lead.id}`,
          title: `Convert qualified lead: ${lead.name}`,
          category: "Growth",
          priority: lead.leadScore >= HIGH_VALUE_LEAD_SCORE ? "high" : "medium",
          trigger: `Lead qualified at score ${lead.leadScore}/100${lead.projectedValue ? ` ($${lead.projectedValue.toLocaleString()} AUD projected)` : ""}`,
          rationale:
            "Qualified leads decay quickly — conversion actions within the same week close at the highest rate.",
          recommendedAction:
            "Prepare an audit-based proposal and book a conversion call.",
          targetType: "creator_lead",
          targetId: lead.id,
          safetyLevel: "safe_create_task",
          link: "/admin/creator-leads",
        })
      )
    } else if (
      lead.leadScore >= HIGH_VALUE_LEAD_SCORE &&
      !proposalLeadIds.has(lead.id)
    ) {
      actions.push(
        makeAction({
          id: `auto-growth-proposal-${lead.id}`,
          title: `Create proposal for high-value lead: ${lead.name}`,
          category: "Growth",
          priority: "high",
          trigger: `Lead score ${lead.leadScore}/100 with no proposal on record`,
          rationale:
            "High-score leads without proposals are unworked pipeline — the strongest conversion signal available.",
          recommendedAction:
            "Draft a proposal tied to the lead's specific bottlenecks for review before sending.",
          targetType: "creator_lead",
          targetId: lead.id,
          safetyLevel: "approval_required",
          link: "/admin/creator-leads",
        })
      )
    }
  }

  if (subscriberCount < LOW_SUBSCRIBER_THRESHOLD) {
    actions.push(
      makeAction({
        id: "auto-growth-campaign",
        title: "Plan audience growth campaign",
        category: "Growth",
        priority: "low",
        trigger: `${subscriberCount} active newsletter subscribers (below ${LOW_SUBSCRIBER_THRESHOLD})`,
        rationale:
          "A small subscriber base limits owned-audience leverage for lead generation.",
        recommendedAction:
          "Plan a lead-magnet driven growth campaign — content and publishing remain manual.",
        targetType: "newsletter",
        targetId: "subscribers",
        safetyLevel: "manual_only",
        link: "/admin/growth",
      })
    )
  }

  // ---------------------------------------------------------------------------
  // Governance rules.
  // ---------------------------------------------------------------------------
  const proposedDecisions = decisions.filter(
    (decision) => decision.status === "proposed"
  )

  if (proposedDecisions.length > 0) {
    actions.push(
      makeAction({
        id: "auto-governance-agenda",
        title: `Add ${proposedDecisions.length} decision${proposedDecisions.length === 1 ? "" : "s"} to boardroom agenda`,
        category: "Governance",
        priority: "medium",
        trigger: `${proposedDecisions.length} proposed decision${proposedDecisions.length === 1 ? "" : "s"} awaiting boardroom review`,
        rationale:
          "Decision packages ready for the boardroom lose momentum when they miss a session.",
        recommendedAction:
          "Add each proposed decision to the next boardroom session agenda.",
        targetType: "executive_decision",
        targetId: proposedDecisions[0].id,
        safetyLevel: "safe_review",
        link: "/admin/decision-packages",
      })
    )
  }

  const staleApproved = decisions.filter(
    (decision) =>
      decision.status === "approved" &&
      (now.getTime() - decision.updatedAt.getTime()) / (24 * 60 * 60 * 1000) >
        STALE_DECISION_DAYS
  )

  for (const decision of staleApproved) {
    actions.push(
      makeAction({
        id: `auto-governance-implement-${decision.id}`,
        title: `Implementation follow-up: ${decision.title}`,
        category: "Governance",
        priority: "high",
        trigger: `Approved ${STALE_DECISION_DAYS}+ days ago with no implementation activity`,
        rationale:
          "The learning engine identifies delayed implementation as the top failure pattern — approved decisions must convert to execution.",
        recommendedAction:
          "Assign an owner and link a strategic initiative to this decision.",
        targetType: "executive_decision",
        targetId: decision.id,
        safetyLevel: "safe_create_task",
        link: "/admin/decision-execution",
      })
    )
  }

  if (risks.length >= 2) {
    actions.push(
      makeAction({
        id: "auto-governance-risk-review",
        title: `Review ${risks.length} active executive risks`,
        category: "Governance",
        priority: risks.some((risk) => risk.severity === "critical")
          ? "critical"
          : "high",
        trigger: `${risks.length} recurring risks detected (${risks
          .slice(0, 2)
          .map((risk) => risk.title)
          .join("; ")})`,
        rationale:
          "Recurring risks without explicit decisions accumulate — each should be accepted, mitigated, or escalated.",
        recommendedAction:
          "Run a risk review and record a decision for every active risk.",
        targetType: "executive_risk",
        targetId: "active",
        safetyLevel: "safe_review",
        link: "/admin/command-center",
      })
    )
  }

  // ---------------------------------------------------------------------------
  // Operations rules.
  // ---------------------------------------------------------------------------
  for (const principle of learning.operatingPrinciples.slice(0, 3)) {
    if (principle.confidence >= 0.8) {
      actions.push(
        makeAction({
          id: `auto-ops-principle-${principle.sourceId}`,
          title: "Standardize operating principle",
          category: "Operations",
          priority: "low",
          trigger: `Principle codified at ${Math.round(principle.confidence * 100)}% confidence`,
          rationale: principle.principle,
          recommendedAction:
            "Document this principle as standard operating procedure and reference it in planning cycles.",
          targetType: "operating_principle",
          targetId: principle.id,
          safetyLevel: "safe_create_task",
          link: "/admin/executive-learning",
        })
      )
    }
  }

  for (const category of learning.weakestCategories) {
    if (category.averageEffectiveness < 40) {
      actions.push(
        makeAction({
          id: `auto-ops-rule-update-${category.category}`,
          title: `Update recommendation rules for ${category.category}`,
          category: "Operations",
          priority: "medium",
          trigger: `${category.category} decisions average ${category.averageEffectiveness}/100 effectiveness`,
          rationale:
            "Recommendation improvement guidance: suppress patterns tied to underperforming categories until evidence improves.",
          recommendedAction:
            "Lower the recommendation weight for this category and require stronger evidence before re-proposing.",
          targetType: "recommendation_rule",
          targetId: category.category,
          safetyLevel: "safe_review",
          link: "/admin/recommendation-improvement",
        })
      )
    }
  }

  // ---------------------------------------------------------------------------
  // Sort + summarize.
  // ---------------------------------------------------------------------------
  actions.sort(
    (a, b) =>
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      a.category.localeCompare(b.category) ||
      a.title.localeCompare(b.title)
  )

  const summary: AutomationSummary = {
    total: actions.length,
    byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
    byCategory: {
      Revenue: 0,
      Client: 0,
      Delivery: 0,
      Growth: 0,
      Governance: 0,
      Operations: 0,
    },
    bySafetyLevel: {
      safe_review: 0,
      safe_create_task: 0,
      approval_required: 0,
      manual_only: 0,
    },
    approvalRequired: 0,
    manualOnly: 0,
    highPriority: 0,
  }

  for (const action of actions) {
    summary.byPriority[action.priority] += 1
    summary.byCategory[action.category] += 1
    summary.bySafetyLevel[action.safetyLevel] += 1

    if (action.requiresApproval) {
      summary.approvalRequired += 1
    }

    if (action.safetyLevel === "manual_only") {
      summary.manualOnly += 1
    }

    if (action.priority === "high" || action.priority === "critical") {
      summary.highPriority += 1
    }
  }

  const automation: ExecutiveAutomation = {
    actions,
    summary,
    generatedAt: now.toISOString(),
  }

  // Fire-and-forget: persistence never blocks or fails the response.
  void storeAutomationSnapshot(automation)

  return automation
}
