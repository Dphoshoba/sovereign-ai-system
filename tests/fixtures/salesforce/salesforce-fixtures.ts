import type { ApprovedAction, TokenSet } from "../../../lib/platform/connector-platform-sdk";
import type { SalesforceResource } from "../../../lib/connectors/salesforce/resource-parser";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

export const SalesforceFixtures = {
  validToken(): TokenSet {
    return {
      accessToken: "salesforce_access_token_valid",
      refreshToken: "salesforce_refresh_token_valid",
      expiresAt: new Date(BASE_TIME.getTime() + 60 * 60000),
      scopes: ["api", "refresh_token"],
    };
  },
  expiredToken(): TokenSet {
    return {
      ...this.validToken(),
      expiresAt: new Date(BASE_TIME.getTime() - 60000),
    };
  },
  accountResource(): SalesforceResource {
    return {
      id: "001000000000001AAA",
      name: "Gamma Account",
      resourceType: "account",
      createdAt: BASE_TIME,
    };
  },
  opportunityResource(): SalesforceResource {
    return {
      id: "006000000000001AAA",
      name: "Gamma Opportunity",
      resourceType: "opportunity",
      stageName: "Prospecting",
      amountCents: 2500000,
      createdAt: BASE_TIME,
    };
  },
  approvedAction(): ApprovedAction {
    return {
      actionId: "salesforce_create_record",
      params: { object: "Opportunity" },
      requestedBy: "operator",
      requestedAt: BASE_TIME,
      approvedBy: "approver",
      approvedAt: BASE_TIME,
      approvalReason: "CRM record creation approved for governed queue test.",
      queueId: "queue-salesforce-001",
    };
  },
};
