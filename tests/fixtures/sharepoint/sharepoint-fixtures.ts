import type { ApprovedAction, TokenSet } from "../../../lib/platform/connector-platform-sdk";
import type { SharePointResource } from "../../../lib/connectors/sharepoint/resource-parser";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

export const SharePointFixtures = {
  validToken(): TokenSet {
    return {
      accessToken: "sharepoint_access_token_valid",
      refreshToken: "sharepoint_refresh_token_valid",
      expiresAt: new Date(BASE_TIME.getTime() + 60 * 60000),
      scopes: ["Sites.Read.All", "Files.Read.All"],
    };
  },
  expiredToken(): TokenSet {
    return {
      ...this.validToken(),
      expiresAt: new Date(BASE_TIME.getTime() - 60000),
    };
  },
  siteResource(): SharePointResource {
    return {
      id: "contoso.sharepoint.com,site-001,web-001",
      name: "Gamma Site",
      resourceType: "site",
      webUrl: "https://contoso.sharepoint.com/sites/gamma",
      modifiedAt: BASE_TIME,
    };
  },
  listResource(): SharePointResource {
    return {
      id: "list-001",
      name: "Gamma List",
      resourceType: "list",
      itemCount: 42,
      modifiedAt: BASE_TIME,
    };
  },
  approvedAction(): ApprovedAction {
    return {
      actionId: "sharepoint_create_list_item",
      params: { listId: "list-001" },
      requestedBy: "operator",
      requestedAt: BASE_TIME,
      approvedBy: "approver",
      approvedAt: BASE_TIME,
      approvalReason: "List item creation approved for governed queue test.",
      queueId: "queue-sharepoint-001",
    };
  },
};
