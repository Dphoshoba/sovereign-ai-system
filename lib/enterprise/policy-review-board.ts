import { buildReviewBoard } from "./review-board"

export function buildPolicyReviewBoard() {
  const board = buildReviewBoard()

  return {
    ...board,
    id: "enterprise-policy-review-board",
    name: "Enterprise Policy Review Board",
    scope: "policy-change-control" as const,
    decisionMode: "recommendation-only" as const,
    persistence: false as const,
    execution: false as const,
  }
}

export function evaluatePolicyReviewReadiness(
  board: ReturnType<typeof buildPolicyReviewBoard> = buildPolicyReviewBoard()
) {
  const hasSeats = board.seats.length > 0
  const recommendationOnly = board.decisionMode === "recommendation-only"
  const noPersistence = board.persistence === false
  const noExecution = board.execution === false
  const checks = [hasSeats, recommendationOnly, noPersistence, noExecution]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "POLICY_REVIEW_BOARD_PREVIEW_READY" as const,
    seatCount: board.seats.length,
    persistence: false,
    execution: false,
  }
}

