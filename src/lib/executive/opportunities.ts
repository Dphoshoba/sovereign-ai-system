import { prisma } from "@/lib/prisma"

export type ExecutiveOpportunity = {
  title: string
  score: number
  potentialValue: number
  nextAction: string
}

const OPEN_LEAD_STATUSES = ["new", "engaged", "qualified", "contacted"]
const OPEN_PROPOSAL_STATUSES = ["draft", "sent", "review"]

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

/**
 * Rule-based opportunity scoring from lead quality, proposal value,
 * revenue trends, client growth, and goal momentum. Deterministic.
 */
export async function generateExecutiveOpportunities(): Promise<
  ExecutiveOpportunity[]
> {
  try {
    const [leads, proposals, goals, clients, projects, invoices] =
      await Promise.all([
        prisma.creatorLead.findMany(),
        prisma.creatorProposal.findMany(),
        prisma.quarterlyGoal.findMany(),
        prisma.clientProfile.findMany(),
        prisma.clientProject.findMany(),
        prisma.clientInvoice.findMany(),
      ])

    const opportunities: ExecutiveOpportunity[] = []

    // Lead quality.
    const leadIdsWithProposals = new Set(
      proposals.filter((p) => p.leadId).map((p) => p.leadId as string)
    )

    for (const lead of leads) {
      if (!OPEN_LEAD_STATUSES.includes(lead.status)) {
        continue
      }

      const readinessBonus = lead.readiness === "hot" ? 10 : 0
      const hasProposal = leadIdsWithProposals.has(lead.id)

      opportunities.push({
        title: `Convert lead: ${lead.name}`,
        score: clampScore(lead.leadScore + readinessBonus),
        potentialValue: lead.projectedValue ?? 0,
        nextAction: hasProposal
          ? `Advance the open proposal for ${lead.name} to a decision.`
          : `Create and send a proposal to ${lead.name}.`,
      })
    }

    // Proposal value.
    const proposalStatusScore: Record<string, number> = {
      review: 80,
      sent: 72,
      draft: 60,
    }

    for (const proposal of proposals) {
      if (!OPEN_PROPOSAL_STATUSES.includes(proposal.status)) {
        continue
      }

      opportunities.push({
        title: `Close proposal: ${proposal.title}`,
        score: clampScore(proposalStatusScore[proposal.status] ?? 55),
        potentialValue: proposal.estimatedValue ?? 0,
        nextAction:
          proposal.status === "draft"
            ? `Finalize and send "${proposal.title}".`
            : `Follow up on "${proposal.title}" and ask for a decision.`,
      })
    }

    // Goal momentum.
    for (const goal of goals) {
      if (goal.status !== "active" || goal.progress < 50) {
        continue
      }

      const remainingValue =
        goal.category === "revenue" &&
        goal.targetValue !== null &&
        goal.currentValue !== null
          ? Math.max(0, goal.targetValue - goal.currentValue)
          : 0

      opportunities.push({
        title: `Goal momentum: ${goal.title}`,
        score: clampScore(40 + goal.progress / 2),
        potentialValue: remainingValue,
        nextAction: `Double down on initiatives driving "${goal.title}" (${goal.progress}% complete).`,
      })
    }

    // Client growth — active clients with paid history are upsell candidates.
    const paidByClient = new Map<string, number>()
    for (const invoice of invoices) {
      if (invoice.status === "paid") {
        paidByClient.set(
          invoice.clientId,
          (paidByClient.get(invoice.clientId) ?? 0) + invoice.amountAud
        )
      }
    }

    const projectValueByClient = new Map<string, number>()
    for (const project of projects) {
      projectValueByClient.set(
        project.clientId,
        (projectValueByClient.get(project.clientId) ?? 0) +
          (project.valueAud ?? 0)
      )
    }

    for (const client of clients) {
      const paid = paidByClient.get(client.id) ?? 0

      if (client.status === "active" && client.type === "client" && paid > 0) {
        const projectValue = projectValueByClient.get(client.id) ?? 0

        opportunities.push({
          title: `Upsell client: ${client.name}`,
          score: clampScore(60 + Math.min(20, paid / 500)),
          potentialValue: Math.round(projectValue * 0.5),
          nextAction: `Propose a follow-on engagement to ${client.name} based on delivered work.`,
        })
      }
    }

    return opportunities.sort(
      (a, b) =>
        b.score - a.score ||
        b.potentialValue - a.potentialValue ||
        a.title.localeCompare(b.title)
    )
  } catch (error) {
    console.error("Executive opportunities engine failed:", error)
    return []
  }
}
