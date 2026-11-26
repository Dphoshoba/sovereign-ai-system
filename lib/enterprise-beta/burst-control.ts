export type BurstControlPolicy = {
  id: string
  target: string
  burstWindowSeconds: number
  burstMultiplier: number
  response: "WARN" | "COOLDOWN" | "REVIEW"
  active: false
}

export function buildBurstControlPolicies(): BurstControlPolicy[] {
  return [
    {
      id: "burst-preview",
      target: "preview routes",
      burstWindowSeconds: 60,
      burstMultiplier: 1.5,
      response: "WARN",
      active: false,
    },
    {
      id: "burst-intent",
      target: "intent package routes",
      burstWindowSeconds: 300,
      burstMultiplier: 1.25,
      response: "REVIEW",
      active: false,
    },
    {
      id: "burst-high-risk",
      target: "future high-risk execution routes",
      burstWindowSeconds: 600,
      burstMultiplier: 1,
      response: "COOLDOWN",
      active: false,
    },
  ]
}

export function evaluateBurstControlReadiness(
  policies: BurstControlPolicy[] = buildBurstControlPolicies()
) {
  const protectedPolicies = policies.filter((policy) => policy.response !== "WARN").length

  return {
    score: Math.round((policies.length / 3) * 60 + protectedPolicies * 10),
    status: "BURST_CONTROL_PLANNED_NOT_ACTIVE" as const,
    policyCount: policies.length,
    active: false,
  }
}
