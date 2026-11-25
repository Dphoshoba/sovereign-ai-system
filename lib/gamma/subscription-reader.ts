import { SUBSCRIPTION_ASSETS } from "../subscription/mock-data"
import type { SubscriptionWorkspace } from "../subscription/types"

export async function getSubscriptionRegistry(): Promise<SubscriptionWorkspace> {
  return SUBSCRIPTION_ASSETS
}
