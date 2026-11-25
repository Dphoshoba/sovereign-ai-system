export type ReleaseBoardSeat = {
  id: string
  roleId: string
  responsibility: string
  approvalMode: "recommendation-only"
  canPromoteProduction: false
}

export function buildReleaseBoardSeats(): ReleaseBoardSeat[] {
  return [
    {
      id: "enterprise-admin-release-seat",
      roleId: "enterprise-administrator",
      responsibility: "Review release readiness and blockers.",
      approvalMode: "recommendation-only",
      canPromoteProduction: false,
    },
    {
      id: "reviewer-release-seat",
      roleId: "enterprise-reviewer",
      responsibility: "Review guard evidence and policy drift.",
      approvalMode: "recommendation-only",
      canPromoteProduction: false,
    },
    {
      id: "research-release-seat",
      roleId: "research-lead",
      responsibility: "Review research and ontology readiness.",
      approvalMode: "recommendation-only",
      canPromoteProduction: false,
    },
  ]
}

export function evaluateReleaseGovernance(
  seats: ReleaseBoardSeat[] = buildReleaseBoardSeats()
) {
  const allRecommendationOnly = seats.every((seat) => seat.approvalMode === "recommendation-only")
  const noProductionPromotion = seats.every((seat) => seat.canPromoteProduction === false)
  const hasSeats = seats.length >= 3
  const checks = [allRecommendationOnly, noProductionPromotion, hasSeats]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "RELEASE_BOARD_PREVIEW_READY" as const,
    seatCount: seats.length,
    productionPromotion: false,
  }
}

