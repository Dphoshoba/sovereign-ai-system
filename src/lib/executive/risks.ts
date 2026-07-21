import { prisma } from "@/lib/prisma"
import { EvidenceConfidence, computeEvidenceConfidence } from './evidence-confidence';

export type ExecutiveRisk = {
  title: string
  severity: "low" | "medium" | "high" | "critical"
  impact: string
  mitigation: string
  evidenceConfidence: EvidenceConfidence
}

const SEVERITY_RANK: Record<ExecutiveRisk["severity"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const ACTIVE_PROJECT_STATUSES = ["active", "in_progress"]
const BOARDROOM_REVIEW_WINDOW_DAYS = 14
const PROJECT_STALL_WINDOW_DAYS = 14

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

/**
 * Rule-based risk detection across revenue, delivery, governance, and
 * strategy. Deterministic — no AI calls.
 */
export async function generateExecutiveRisks(): Promise<ExecutiveRisk[]> {
  try {
    const now = new Date()

    const [invoices, projects, tasks, decisions, goals, boardroomSessions] =
      await Promise.all([
        prisma.clientInvoice.findMany({ where: { isTest: false } }),
        prisma.clientProject.findMany({ where: { isTest: false } }),
        prisma.clientProjectTask.findMany({ where: { isTest: false } }),
        prisma.executiveDecision.findMany(),
        prisma.quarterlyGoal.findMany(),
        prisma.executiveBoardroomSession.findMany({
          orderBy: { createdAt: "desc" },
          take: 1,
        }),
      ])

    const risks: ExecutiveRisk[] = []

    // Unpaid and overdue invoices.
    for (const invoice of invoices) {
      if (invoice.status === "paid") {
        continue
      }

      const amount = `AUD ${invoice.amountAud.toLocaleString("en-AU")}`

      if (invoice.dueDate && invoice.dueDate < now) {
        risks.push({
          title: `Overdue invoice ${invoice.invoiceNumber}`,
          severity: invoice.amountAud >= 2000 ? "critical" : "high",
          impact: `${amount} of revenue is past due, straining cash flow.`,
          mitigation: `Send a payment reminder for ${invoice.invoiceNumber} and agree on a payment date.`,
          evidenceConfidence: computeEvidenceConfidence({
            evidenceIds: [invoice.id, `invoice-status-${invoice.status}`],
            sourceCount: 2,
            timestampMs: new Date(invoice.updatedAt).getTime(),
          }),
        })
      } else if (invoice.status === "sent") {
        risks.push({
          title: `Unpaid invoice ${invoice.invoiceNumber}`,
          severity: "medium",
          impact: `${amount} is invoiced but not yet collected.`,
          mitigation: `Confirm receipt of ${invoice.invoiceNumber} and the expected payment date.`,
          evidenceConfidence: computeEvidenceConfidence({
            evidenceIds: [invoice.id, `invoice-status-${invoice.status}`],
            sourceCount: 1,
            timestampMs: new Date(invoice.updatedAt).getTime(),
          }),
        })
      }
    }

    // Stalled or overdue projects.
    const openTasksByProject = new Map<string, number>()
    for (const task of tasks) {
      if (task.status !== "done") {
        openTasksByProject.set(
          task.projectId,
          (openTasksByProject.get(task.projectId) ?? 0) + 1
        )
      }
    }

    const stallThreshold = daysAgo(PROJECT_STALL_WINDOW_DAYS)

    for (const project of projects) {
      const overdue =
        project.dueDate &&
        project.dueDate < now &&
        project.status !== "completed"

      const stalled =
        ACTIVE_PROJECT_STATUSES.includes(project.status) &&
        project.updatedAt < stallThreshold &&
        (openTasksByProject.get(project.id) ?? 0) > 0

      if (overdue) {
        risks.push({
          title: `Project overdue: ${project.title}`,
          severity: "high",
          impact: "Client delivery commitment has been missed.",
          mitigation: `Re-plan "${project.title}" and communicate a revised timeline to the client.`,
          evidenceConfidence: computeEvidenceConfidence({
            evidenceIds: [project.id, `project-status-${project.status}`],
            sourceCount: 2,
            timestampMs: new Date(project.updatedAt).getTime(),
          }),
        })
      } else if (stalled) {
        risks.push({
          title: `Project stalled: ${project.title}`,
          severity: "medium",
          impact: `No activity for ${PROJECT_STALL_WINDOW_DAYS}+ days with open tasks remaining.`,
          mitigation: `Review open tasks on "${project.title}" and restart delivery momentum.`,
          evidenceConfidence: computeEvidenceConfidence({
            evidenceIds: [project.id, `project-stalled-${PROJECT_STALL_WINDOW_DAYS}d`],
            sourceCount: 1,
            timestampMs: new Date(project.updatedAt).getTime(),
          }),
        })
      }
    }

    // Decisions missing follow-through.
    const pendingDecisions = decisions.filter(
      (decision) =>
        decision.status === "proposed" || decision.status === "approved"
    )

    if (pendingDecisions.length > 0) {
      risks.push({
        title: `${pendingDecisions.length} decision${pendingDecisions.length === 1 ? "" : "s"} awaiting implementation`,
        severity: pendingDecisions.length >= 3 ? "high" : "medium",
        impact: "Approved direction is not being executed, slowing strategy.",
        mitigation: "Assign owners and implementation dates to pending decisions.",
        evidenceConfidence: computeEvidenceConfidence({
          evidenceIds: pendingDecisions.map((d) => d.id),
          sourceCount: pendingDecisions.length > 2 ? 3 : pendingDecisions.length,
          timestampMs: pendingDecisions.length > 0 ? new Date(pendingDecisions[0].updatedAt).getTime() : Date.now(),
        }),
      })
    }

    const missingFollowUps = decisions.filter(
      (decision) => decision.followUpRequired && !decision.reviewDate
    )

    if (missingFollowUps.length > 0) {
      risks.push({
        title: `${missingFollowUps.length} decision${missingFollowUps.length === 1 ? "" : "s"} missing review dates`,
        severity: "low",
        impact: "Follow-up reviews may be skipped, weakening the learning loop.",
        mitigation: "Set review dates during the next boardroom session.",
        evidenceConfidence: computeEvidenceConfidence({
          evidenceIds: missingFollowUps.map((d) => d.id),
          sourceCount: missingFollowUps.length > 2 ? 3 : missingFollowUps.length,
          timestampMs: missingFollowUps.length > 0 ? new Date(missingFollowUps[0].updatedAt).getTime() : Date.now(),
        }),
      })
    }

    // Declining goal confidence — active goals with low progress.
    for (const goal of goals) {
      if (goal.status === "active" && goal.progress < 25) {
        risks.push({
          title: `Goal at risk: ${goal.title}`,
          severity: goal.progress < 15 ? "high" : "medium",
          impact: `Only ${goal.progress}% progress in ${goal.quarter} ${goal.year} — target likely to be missed.`,
          mitigation: `Run a strategic review of "${goal.title}" and rescope or reinforce initiatives.`,
          evidenceConfidence: computeEvidenceConfidence({
            evidenceIds: [goal.id, `goal-progress-${goal.progress}`],
            sourceCount: 1,
            timestampMs: new Date(goal.updatedAt).getTime(),
          }),
        })
      }
    }

    // Boardroom cadence — no review in the last N days.
    const latestSession = boardroomSessions[0] ?? null
    const reviewThreshold = daysAgo(BOARDROOM_REVIEW_WINDOW_DAYS)

    if (!latestSession || latestSession.createdAt < reviewThreshold) {
      risks.push({
        title: `No boardroom review in ${BOARDROOM_REVIEW_WINDOW_DAYS}+ days`,
        severity: "medium",
        impact: "Executive oversight cadence has lapsed; priorities may drift.",
        mitigation: "Schedule a boardroom session and review current priorities.",
        evidenceConfidence: computeEvidenceConfidence({
          evidenceIds: ['boardroom-cadence-gap'],
          sourceCount: 1,
          timestampMs: latestSession ? new Date(latestSession.createdAt).getTime() : Date.now() - 365 * 24 * 60 * 60 * 1000,
        }),
      })
    }

    return risks.sort(
      (a, b) =>
        SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
        a.title.localeCompare(b.title)
    )
  } catch (error) {
    console.error("Executive risks engine failed:", error)
    return []
  }
}
