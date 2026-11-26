import { prisma } from "@/lib/prisma"
import { EvidenceConfidence, ReasoningChain, computeEvidenceConfidence, buildReasoning } from './evidence-confidence';

export type ExecutiveOpportunity = {
  title: string
  score: number
  potentialValue: number
  nextAction: string
  evidenceConfidence: EvidenceConfidence
  reasoning: ReasoningChain
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
        prisma.creatorLead.findMany({ where: { isTest: false } }),
        prisma.creatorProposal.findMany({ where: { isTest: false } }),
        prisma.quarterlyGoal.findMany(),
        prisma.clientProfile.findMany({ where: { isTest: false } }),
        prisma.clientProject.findMany({ where: { isTest: false } }),
        prisma.clientInvoice.findMany({ where: { isTest: false } }),
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

      const leadEc = computeEvidenceConfidence({
        evidenceIds: [lead.id, `lead-status-${lead.status}`],
        sourceCount: lead.leadScore > 70 ? 3 : 1,
        timestampMs: new Date(lead.updatedAt).getTime(),
        missingEvidence: lead.readiness === 'unknown' ? ['Missing readiness assessment'] : [],
      })

      opportunities.push({
        title: `Convert lead: ${lead.name}`,
        score: clampScore(lead.leadScore + readinessBonus),
        potentialValue: lead.projectedValue ?? 0,
        nextAction: hasProposal
          ? `Advance the open proposal for ${lead.name} to a decision.`
          : `Create and send a proposal to ${lead.name}.`,
        evidenceConfidence: leadEc,
        reasoning: buildReasoning({
          summary: `Lead ${lead.name} scored ${lead.leadScore} with readiness ${lead.readiness}`,
          evidenceIds: leadEc.evidenceIds,
          confidenceScore: leadEc.score,
          sourceCount: leadEc.sourceCount,
          dataFreshnessHours: leadEc.dataFreshnessHours,
          missingEvidence: leadEc.missingEvidence,
          hasConflictingEvidence: leadEc.hasConflictingEvidence,
          decisionFactors: ['Lead quality assessment', `Lead score: ${lead.leadScore}`, `Status: ${lead.status}`, `Readiness: ${lead.readiness}`],
        }),
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

      const proposalEc = computeEvidenceConfidence({
        evidenceIds: [proposal.id, `proposal-status-${proposal.status}`],
        sourceCount: proposal.status === 'review' ? 3 : 2,
        timestampMs: new Date(proposal.updatedAt).getTime(),
        missingEvidence: proposal.status === 'draft' ? ['Proposal not yet sent to client'] : [],
      })

      opportunities.push({
        title: `Close proposal: ${proposal.title}`,
        score: clampScore(proposalStatusScore[proposal.status] ?? 55),
        potentialValue: proposal.estimatedValue ?? 0,
        nextAction:
          proposal.status === "draft"
            ? `Finalize and send "${proposal.title}".`
            : `Follow up on "${proposal.title}" and ask for a decision.`,
        evidenceConfidence: proposalEc,
        reasoning: buildReasoning({
          summary: `Proposal "${proposal.title}" is in ${proposal.status} status with estimated value ${proposal.estimatedValue ?? 0}`,
          evidenceIds: proposalEc.evidenceIds,
          confidenceScore: proposalEc.score,
          sourceCount: proposalEc.sourceCount,
          dataFreshnessHours: proposalEc.dataFreshnessHours,
          missingEvidence: proposalEc.missingEvidence,
          hasConflictingEvidence: proposalEc.hasConflictingEvidence,
          decisionFactors: ['Proposal pipeline assessment', `Status: ${proposal.status}`, `Estimated value: ${proposal.estimatedValue ?? 0}`],
        }),
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

      const goalEc = computeEvidenceConfidence({
        evidenceIds: [goal.id, `goal-category-${goal.category}`],
        sourceCount: goal.progress > 50 ? 3 : 1,
        timestampMs: new Date(goal.updatedAt).getTime(),
        missingEvidence: goal.progress < 75 ? ['Goal completion path unverified'] : [],
      })

      opportunities.push({
        title: `Goal momentum: ${goal.title}`,
        score: clampScore(40 + goal.progress / 2),
        potentialValue: remainingValue,
        nextAction: `Double down on initiatives driving "${goal.title}" (${goal.progress}% complete).`,
        evidenceConfidence: goalEc,
        reasoning: buildReasoning({
          summary: `Goal "${goal.title}" is at ${goal.progress}% progress in ${goal.quarter} ${goal.year}`,
          evidenceIds: goalEc.evidenceIds,
          confidenceScore: goalEc.score,
          sourceCount: goalEc.sourceCount,
          dataFreshnessHours: goalEc.dataFreshnessHours,
          missingEvidence: goalEc.missingEvidence,
          hasConflictingEvidence: goalEc.hasConflictingEvidence,
          decisionFactors: ['Goal momentum tracking', `Progress: ${goal.progress}%`, `Category: ${goal.category}`, `Quarter: ${goal.quarter} ${goal.year}`],
        }),
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

        const clientEc = computeEvidenceConfidence({
          evidenceIds: [client.id],
          sourceCount: paid > 1000 ? 3 : 1,
          timestampMs: new Date(client.updatedAt).getTime(),
          missingEvidence: [],
        })

        opportunities.push({
          title: `Upsell client: ${client.name}`,
          score: clampScore(60 + Math.min(20, paid / 500)),
          potentialValue: Math.round(projectValue * 0.5),
          nextAction: `Propose a follow-on engagement to ${client.name} based on delivered work.`,
          evidenceConfidence: clientEc,
          reasoning: buildReasoning({
            summary: `Client ${client.name} has paid AUD ${paid.toLocaleString('en-AU')} with active status`,
            evidenceIds: clientEc.evidenceIds,
            confidenceScore: clientEc.score,
            sourceCount: clientEc.sourceCount,
            dataFreshnessHours: clientEc.dataFreshnessHours,
            missingEvidence: clientEc.missingEvidence,
            hasConflictingEvidence: clientEc.hasConflictingEvidence,
            decisionFactors: ['Client growth assessment', `Paid revenue: AUD ${paid.toLocaleString('en-AU')}`, `Client type: ${client.type}`, `Status: ${client.status}`],
          }),
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
