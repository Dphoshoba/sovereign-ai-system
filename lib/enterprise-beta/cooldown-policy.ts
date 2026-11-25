export type CooldownPolicy = {
  id: string
  trigger: string
  cooldownMinutes: number
  operatorVisible: boolean
  appealPath: "review-board" | "administrator" | "none"
  active: false
}

export function buildCooldownPolicies(): CooldownPolicy[] {
  return [
    {
      id: "cooldown-preview-scrape",
      trigger: "Preview route scraping pattern",
      cooldownMinutes: 15,
      operatorVisible: true,
      appealPath: "administrator",
      active: false,
    },
    {
      id: "cooldown-intent-burst",
      trigger: "Intent package burst",
      cooldownMinutes: 30,
      operatorVisible: true,
      appealPath: "review-board",
      active: false,
    },
    {
      id: "cooldown-cross-tenant",
      trigger: "Cross-tenant boundary pressure",
      cooldownMinutes: 120,
      operatorVisible: true,
      appealPath: "review-board",
      active: false,
    },
  ]
}

export function evaluateCooldownReadiness(
  policies: CooldownPolicy[] = buildCooldownPolicies()
) {
  const explainable = policies.filter((policy) => policy.operatorVisible).length
  const appeals = policies.filter((policy) => policy.appealPath !== "none").length

  return {
    score: Math.round((explainable / policies.length) * 58 + (appeals / policies.length) * 30),
    status: "COOLDOWNS_DEFINED_NOT_ACTIVE" as const,
    policyCount: policies.length,
    active: false,
  }
}
