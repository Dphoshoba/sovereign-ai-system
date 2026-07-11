import { PLATFORM_BASE_TIME } from "../../../lib/platform/mock-time-helpers";
import type { NotionResource } from "../../../lib/connectors/notion/resource-parser";

const BASE_TIME = PLATFORM_BASE_TIME;

export const NotionFixtures = {
  pageResource: (): NotionResource => ({
    id: "notion_page_001",
    title: "Launch Plan",
    resourceType: "page",
    url: "https://notion.so/launch-plan",
    createdAt: BASE_TIME,
  }),
  databaseResource: (): NotionResource => ({
    id: "notion_database_001",
    title: "Content Calendar",
    resourceType: "database",
    url: "https://notion.so/content-calendar",
    createdAt: new Date(BASE_TIME.getTime() + 60 * 60000),
  }),
  validToken: () => ({
    accessToken: "notion_access_token_valid_1234567890",
    expiresAt: new Date(BASE_TIME.getTime() + 3600000),
    scopes: ["read_content"],
  }),
  expiredToken: () => ({
    accessToken: "notion_access_token_expired_1234567890",
    expiresAt: new Date(BASE_TIME.getTime() - 1000),
    scopes: [],
  }),
  approvedAction: () => ({
    actionId: "notion_create_page",
    params: { title: "Approved page" },
    requestedBy: "user",
    requestedAt: BASE_TIME,
    approvedBy: "admin",
    approvedAt: BASE_TIME,
    approvalReason: "Standard approval",
    queueId: "notion_queue_001",
  }),
};
