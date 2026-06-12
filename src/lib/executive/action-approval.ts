import { generateExecutiveAutomationActions } from "./automation-engine"

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "deferred"

export type ExecutiveActionApproval = {
  id: string
  title: string
  category: string
  priority: string
  recommendedAction: string
  safetyLevel: string
  requiresApproval: boolean
  approvalStatus: ApprovalStatus
  decision: string
  rationale: string
  link: string
}

export async function buildActionApprovalQueue() {
  const automation = await generateExecutiveAutomationActions()

  const approvals: ExecutiveActionApproval[] =
    automation.actions.map((action) => {
      const approvalStatus: ApprovalStatus =
        action.requiresApproval ? "pending" : "approved"

      return {
        id: action.id,
        title: action.title,
        category: action.category,
        priority: action.priority,
        recommendedAction: action.recommendedAction,
        safetyLevel: action.safetyLevel,
        requiresApproval: action.requiresApproval,
        approvalStatus,
        decision: action.requiresApproval
          ? "Human approval required before execution."
          : "Safe to proceed as a review/task action.",
        rationale: action.rationale,
        link: action.link,
      }
    })

  return {
    total: approvals.length,
    pending: approvals.filter(
      a => a.approvalStatus === "pending"
    ).length,

    approved: approvals.filter(
      a => a.approvalStatus === "approved"
    ).length,

    rejected: approvals.filter(
      a => a.approvalStatus === "rejected"
    ).length,

    deferred: approvals.filter(
      a => a.approvalStatus === "deferred"
    ).length,

    approvals,

    generatedAt: new Date().toISOString(),
  }
}