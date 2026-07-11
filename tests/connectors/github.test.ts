import { describe, expect, it, beforeEach } from "vitest";
import { GitHubActions } from "../../lib/connectors/github/action-set";
import { GitHubClient } from "../../lib/connectors/github/api-client";
import { GitHubOAuth } from "../../lib/connectors/github/oauth-adapter";
import {
  getGitHubProductionReadiness,
  getGitHubRetryPolicy,
  projectGitHubHealth,
} from "../../lib/connectors/github/production-readiness";
import { GitHubParser } from "../../lib/connectors/github/resource-parser";
import { GitHubReader } from "../../lib/gamma/github-reader";
import { GitHubFixtures } from "../fixtures/github/github-fixtures";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

describe("GitHub Connector", () => {
  describe("OAuth Adapter", () => {
    it("defines GitHub OAuth endpoints and scopes", () => {
      expect(GitHubOAuth.authorizationUrl).toContain("github.com");
      expect(GitHubOAuth.tokenUrl).toContain("github.com");
      expect(GitHubOAuth.requiredScopes).toContain("read:org");
    });

    it("masks healthy tokens", () => {
      const result = GitHubOAuth.validateToken({
        ...GitHubFixtures.validToken(),
        expiresAt: new Date("2099-01-01T00:00:00.000Z"),
      });

      expect(result.valid).toBe(true);
      expect(result.maskedToken).toContain("****");
      expect(result.maskedToken).not.toContain("github_access_token_valid");
    });

    it("detects expired tokens", () => {
      const result = GitHubOAuth.validateToken(GitHubFixtures.expiredToken());

      expect(result.valid).toBe(false);
      expect(result.issue).toBe("expired");
    });
  });

  describe("API Client", () => {
    it("defines GitHub API metadata, quotas, and rate tiers", () => {
      expect(GitHubClient.serviceName).toBe("GitHub");
      expect(GitHubClient.baseUrl).toContain("api.github.com");
      expect(GitHubClient.quotaDefinitions.length).toBeGreaterThan(0);
      expect(GitHubClient.rateLimitTiers.length).toBeGreaterThan(0);
    });
  });

  describe("Resource Parser", () => {
    it("parses GitHub issue metadata", () => {
      const parsed = GitHubParser.parse({
        id: "issue-1",
        title: "Fix release gate",
        resourceType: "issue",
        html_url: "https://github.com/example/repo/issues/1",
        created_at: BASE_TIME.toISOString(),
      });

      expect(parsed.id).toBe("issue-1");
      expect(parsed.name).toBe("Fix release gate");
      expect(parsed.resourceType).toBe("issue");
    });

    it("validates complete resources and rejects incomplete resources", () => {
      expect(GitHubParser.validate(GitHubFixtures.repositoryResource()).valid).toBe(true);
      expect(
        GitHubParser.validate({
          id: "",
          name: "",
          resourceType: "repository",
          url: "",
          createdAt: new Date("bad"),
        }).valid
      ).toBe(false);
    });

    it("redacts access tokens from resource URLs", () => {
      const sanitized = GitHubParser.sanitize({
        ...GitHubFixtures.repositoryResource(),
        url: "https://api.github.com/repos/example/repo?access_token=secret",
      });

      expect(sanitized.url).toContain("access_token=[redacted]");
      expect(sanitized.url).not.toContain("secret");
    });
  });

  describe("Action Set", () => {
    it("supports read and create issue actions", () => {
      expect(GitHubActions.supportedActions.map((action) => action.id)).toEqual([
        "github_read",
        "github_create_issue",
      ]);
    });

    it("previews write actions with approval warnings", async () => {
      const preview = await GitHubActions.preview({
        actionId: "github_create_issue",
        params: {},
        requestedBy: "operator",
        requestedAt: BASE_TIME,
      });

      expect(preview.requiresApproval).toBe(true);
      expect(preview.riskWarnings.join(" ")).toContain("approval");
    });

    it("queues approved actions when live execution is disabled", async () => {
      const receipt = await GitHubActions.execute(GitHubFixtures.approvedAction());

      expect(receipt.status).toBe("queued");
      expect(receipt.auditId).toContain("github-audit");
    });
  });

  describe("GitHub Reader", () => {
    let reader: GitHubReader;

    beforeEach(() => {
      reader = new GitHubReader();
    });

    it("stores, filters, and summarizes GitHub resources deterministically", () => {
      reader.set("repo", GitHubFixtures.repositoryResource());
      reader.set("issue", GitHubFixtures.issueResource());

      expect(reader.getByType("issue")).toHaveLength(1);
      expect(reader.getSummary(BASE_TIME).total).toBe(2);
      expect(reader.getSummary(BASE_TIME)).toEqual(reader.getSummary(BASE_TIME));
    });
  });

  describe("Production Readiness", () => {
    it("is certification-ready until score reaches production threshold", () => {
      const readiness = getGitHubProductionReadiness();

      expect(readiness.connectorId).toBe("github");
      expect(readiness.priorityRank).toBe(4);
      expect(readiness.status).toBe("certification-ready");
      expect(readiness.missingCapabilities).toEqual([]);
    });

    it("uses deterministic retry and health projections", () => {
      expect(getGitHubRetryPolicy().scheduleSeconds).toEqual([5, 10, 20]);

      const health = projectGitHubHealth({
        currentTime: BASE_TIME,
        quotaUsedPercent: 30,
        tokenExpiresAt: new Date(BASE_TIME.getTime() + 60 * 60000),
      });

      expect(health.status).toBe("healthy");
      expect(health.checkedAt).toEqual(BASE_TIME);
    });
  });
});
