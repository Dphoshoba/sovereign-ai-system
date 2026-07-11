import type { ApprovedAction, TokenSet } from "../../../lib/platform/connector-platform-sdk";
import type { HubSpotResource } from "../../../lib/connectors/hubspot/resource-parser";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

export const HubSpotFixtures = {
  validToken(): TokenSet {
    return {
      accessToken: "hubspot_access_token_valid",
      refreshToken: "hubspot_refresh_token_valid",
      expiresAt: new Date(BASE_TIME.getTime() + 60 * 60000),
      scopes: ["crm.objects.contacts.read", "crm.objects.companies.read"],
    };
  },
  expiredToken(): TokenSet {
    return {
      ...this.validToken(),
      expiresAt: new Date(BASE_TIME.getTime() - 60000),
    };
  },
  contactResource(): HubSpotResource {
    return {
      id: "101",
      name: "Gamma Contact",
      resourceType: "contact",
      createdAt: BASE_TIME,
    };
  },
  dealResource(): HubSpotResource {
    return {
      id: "202",
      name: "Gamma Deal",
      resourceType: "deal",
      pipelineStage: "appointmentscheduled",
      amountCents: 1800000,
      createdAt: BASE_TIME,
    };
  },
  approvedAction(): ApprovedAction {
    return {
      actionId: "hubspot_create_record",
      params: { object: "deal" },
      requestedBy: "operator",
      requestedAt: BASE_TIME,
      approvedBy: "approver",
      approvedAt: BASE_TIME,
      approvalReason: "CRM record creation approved for governed queue test.",
      queueId: "queue-hubspot-001",
    };
  },
};
