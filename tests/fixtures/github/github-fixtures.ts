import { PLATFORM_BASE_TIME } from "../../../lib/platform/mock-time-helpers";
import type { GitHubResource } from "../../../lib/connectors/github/resource-parser";

const BASE_TIME = PLATFORM_BASE_TIME;

export const GitHubFixtures = {
  repositoryResource: (): GitHubResource => ({
    id: "repo_001",
    name: "sovereign-ai-system",
    resourceType: "repository",
    url: "https://github.com/example/sovereign-ai-system",
    createdAt: BASE_TIME,
  }),
  issueResource: (): GitHubResource => ({
    id: "issue_001",
    name: "Ship Gamma 2 readiness gate",
    resourceType: "issue",
    url: "https://github.com/example/sovereign-ai-system/issues/1",
    createdAt: new Date(BASE_TIME.getTime() + 60 * 60000),
  }),
  validToken: () => ({
    accessToken: "github_access_token_valid_1234567890",
    expiresAt: new Date(BASE_TIME.getTime() + 3600000),
    scopes: ["repo:status", "read:org"],
  }),
  expiredToken: () => ({
    accessToken: "github_access_token_expired_1234567890",
    expiresAt: new Date(BASE_TIME.getTime() - 1000),
    scopes: [],
  }),
  approvedAction: () => ({
    actionId: "github_create_issue",
    params: { title: "Approved issue" },
    requestedBy: "user",
    requestedAt: BASE_TIME,
    approvedBy: "admin",
    approvedAt: BASE_TIME,
    approvalReason: "Standard approval",
    queueId: "github_queue_001",
  }),
};
