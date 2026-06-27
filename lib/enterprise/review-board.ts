import { buildEnterpriseRoles } from "./enterprise-role-model"

export type ReviewBoardSeat = {
  id: string
  roleId: string
  name: string
  scope: "enterprise" | "workspace" | "domain"
  votingMode: "advisory-only"
  canExecute: false
}

export type ReviewBoard = {
  id: string
  name: string
  status: "preview-only"
  seats: ReviewBoardSeat[]
  quorumRule: "contract-only"
  persistence: false
}

export function buildReviewBoard(): ReviewBoard {
  const roleIds = new Set(buildEnterpriseRoles().map((role) => role.id))
  const candidateSeats: ReviewBoardSeat[] = [
    {
      id: "enterprise-admin-seat",
      roleId: "enterprise-administrator",
      name: "Enterprise Administration Seat",
      scope: "enterprise",
      votingMode: "advisory-only",
      canExecute: false,
    },
    {
      id: "enterprise-reviewer-seat",
      roleId: "enterprise-reviewer",
      name: "Enterprise Reviewer Seat",
      scope: "enterprise",
      votingMode: "advisory-only",
      canExecute: false,
    },
    {
      id: "research-lead-seat",
      roleId: "research-lead",
      name: "Research Lead Seat",
      scope: "domain",
      votingMode: "advisory-only",
      canExecute: false,
    },
    {
      id: "content-strategist-seat",
      roleId: "content-strategist",
      name: "Content Strategy Seat",
      scope: "domain",
      votingMode: "advisory-only",
      canExecute: false,
    },
  ]
  const seats = candidateSeats.filter((seat) => roleIds.has(seat.roleId))

  return {
    id: "enterprise-review-board",
    name: "Enterprise Review Board",
    status: "preview-only",
    seats,
    quorumRule: "contract-only",
    persistence: false,
  }
}

export function evaluateReviewCoverage(board: ReviewBoard = buildReviewBoard()) {
  const hasEnterpriseSeat = board.seats.some((seat) => seat.scope === "enterprise")
  const hasDomainSeat = board.seats.some((seat) => seat.scope === "domain")
  const allAdvisory = board.seats.every((seat) => seat.votingMode === "advisory-only")
  const noExecution = board.seats.every((seat) => seat.canExecute === false)
  const checks = [hasEnterpriseSeat, hasDomainSeat, allAdvisory, noExecution]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "REVIEW_BOARD_PREVIEW_READY" as const,
    seatCount: board.seats.length,
    persistence: board.persistence,
    execution: false,
  }
}
