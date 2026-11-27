import { PLATFORM_BASE_TIME } from "../../../lib/platform/mock-time-helpers";
import type { StripeResource } from "../../../lib/connectors/stripe/resource-parser";

const BASE_TIME = PLATFORM_BASE_TIME;

export const StripeFixtures = {
  customerResource: (): StripeResource => ({
    id: "cus_001",
    name: "Gamma Customer",
    resourceType: "customer",
    createdAt: BASE_TIME,
  }),
  invoiceResource: (): StripeResource => ({
    id: "in_001",
    name: "Launch Invoice",
    resourceType: "invoice",
    amountCents: 120000,
    createdAt: new Date(BASE_TIME.getTime() + 60 * 60000),
  }),
  validToken: () => ({
    accessToken: "stripe_access_token_valid_1234567890",
    expiresAt: new Date(BASE_TIME.getTime() + 3600000),
    scopes: ["read_only"],
  }),
  expiredToken: () => ({
    accessToken: "stripe_access_token_expired_1234567890",
    expiresAt: new Date(BASE_TIME.getTime() - 1000),
    scopes: [],
  }),
  approvedAction: () => ({
    actionId: "stripe_create_invoice",
    params: { customerId: "cus_001" },
    requestedBy: "user",
    requestedAt: BASE_TIME,
    approvedBy: "admin",
    approvedAt: BASE_TIME,
    approvalReason: "Standard approval",
    queueId: "stripe_queue_001",
  }),
};
