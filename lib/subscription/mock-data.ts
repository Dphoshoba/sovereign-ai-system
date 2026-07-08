import type { SubscriptionWorkspace } from "./types"

export const SUBSCRIPTION_ASSETS: SubscriptionWorkspace = {
  plans: [
    {
      id: "plan-free",
      name: "free",
      billingModel: "monthly",
      priceMonthly: 0,
      featureFlags: ["basic-missions", "knowledge-base"],
      usageLimits: { users: 1, missions: 3, aiCalls: 100, storage: 1 },
    },
    {
      id: "plan-creator",
      name: "creator",
      billingModel: "monthly",
      priceMonthly: 29,
      featureFlags: ["basic-missions", "knowledge-base", "ai-agents", "analytics"],
      usageLimits: { users: 5, missions: 10, aiCalls: 1000, storage: 10 },
    },
    {
      id: "plan-professional",
      name: "professional",
      billingModel: "annual",
      priceMonthly: 79,
      featureFlags: ["basic-missions", "knowledge-base", "ai-agents", "analytics", "integrations", "api-access"],
      usageLimits: { users: 25, missions: 50, aiCalls: 10000, storage: 100 },
    },
    {
      id: "plan-enterprise",
      name: "enterprise",
      billingModel: "annual",
      priceMonthly: 299,
      featureFlags: ["all-features", "white-label", "sso", "audit-logs", "custom-ai", "priority-support"],
      usageLimits: { users: 500, missions: 500, aiCalls: 100000, storage: 1000 },
    },
    {
      id: "plan-government",
      name: "government",
      billingModel: "custom",
      priceMonthly: 599,
      featureFlags: ["all-features", "air-gap", "compliance", "fedramp", "custom-deployment", "dedicated-support"],
      usageLimits: { users: 10000, missions: 10000, aiCalls: 1000000, storage: 10000 },
    },
  ],
  metrics: {
    totalPlans: 5,
    activePlans: 5,
    totalSubscribers: 1247,
    mrr: 94850,
    healthScore: 92,
  },
}
