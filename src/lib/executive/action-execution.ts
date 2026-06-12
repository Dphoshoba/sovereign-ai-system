import { buildActionApprovalQueue } from "./action-approval"

export type ExecutionStatus =
  | "ready"
  | "blocked"
  | "manual_required"
  | "executed"

export type ExecutableAction = {
  id: string
  title: string
  category: string
  priority: string
  status: ExecutionStatus
  executionMode: "create_task" | "review_only" | "manual_only"
  executionSummary: string
  sourceApprovalStatus: string
  recommendedAction: string
  link: string
}

export async function buildActionExecutionQueue() {
  const approvalQueue = await buildActionApprovalQueue()

  const executableActions: ExecutableAction[] =
    approvalQueue.approvals.map((approval) => {
      const status: ExecutionStatus =
        approval.approvalStatus === "pending"
          ? "blocked"
          : approval.safetyLevel === "manual_only"
            ? "manual_required"
            : "ready"

      const executionMode =
        approval.safetyLevel === "safe_create_task"
          ? "create_task"
          : approval.safetyLevel === "manual_only"
            ? "manual_only"
            : "review_only"

      return {
        id: approval.id,
        title: approval.title,
        category: approval.category,
        priority: approval.priority,
        status,
        executionMode,
        executionSummary:
          status === "blocked"
            ? "Waiting for human approval."
            : status === "manual_required"
              ? "Manual execution required."
              : executionMode === "create_task"
                ? "Ready to create a task."
                : "Ready for executive review.",
        sourceApprovalStatus: approval.approvalStatus,
        recommendedAction: approval.recommendedAction,
        link: approval.link,
      }
    })

  return {
    total: executableActions.length,
    ready: executableActions.filter(a => a.status === "ready").length,
    blocked: executableActions.filter(a => a.status === "blocked").length,
    manualRequired: executableActions.filter(
      a => a.status === "manual_required"
    ).length,
    executed: executableActions.filter(a => a.status === "executed").length,
    actions: executableActions,
    generatedAt: new Date().toISOString(),
  }
}