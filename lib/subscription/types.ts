export type PlanName = "free" | "creator" | "professional" | "enterprise" | "government"
export type BillingModel = "monthly" | "annual" | "custom"

export type UsageLimits = {
  users: number
  missions: number
  aiCalls: number
  storage: number
}

export type SubscriptionPlan = {
  id: string
  name: PlanName
  billingModel: BillingModel
  priceMonthly: number
  featureFlags: string[]
  usageLimits: UsageLimits
}

export type SubscriptionMetrics = {
  totalPlans: number
  activePlans: number
  totalSubscribers: number
  mrr: number
  healthScore: number
}

export type SubscriptionWorkspace = {
  plans: SubscriptionPlan[]
  metrics: SubscriptionMetrics
}
