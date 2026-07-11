import { describe, expect, it, beforeEach } from "vitest";
import { NotionActions } from "../../lib/connectors/notion/action-set";
import { NotionClient } from "../../lib/connectors/notion/api-client";
import { NotionOAuth } from "../../lib/connectors/notion/oauth-adapter";
import {
  getNotionProductionReadiness,
  getNotionRetryPolicy,
  projectNotionHealth,
} from "../../lib/connectors/notion/production-readiness";
import { NotionParser } from "../../lib/connectors/notion/resource-parser";
import { NotionReader } from "../../lib/gamma/notion-reader";
import { NotionFixtures } from "../fixtures/notion/notion-fixtures";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

describe("Notion Connector", () => {
  describe("OAuth Adapter", () => {
    it("defines Notion OAuth endpoints and scopes", () => {
      expect(NotionOAuth.authorizationUrl).toContain("notion.com");
      expect(NotionOAuth.tokenUrl).toContain("notion.com");
      expect(NotionOAuth.requiredScopes).toContain("read_content");
    });

    it("masks healthy tokens", () => {
      const result = NotionOAuth.validateToken({
        ...NotionFixtures.validToken(),
        expiresAt: new Date("2099-01-01T00:00:00.000Z"),
      });

      expect(result.valid).toBe(true);
      expect(result.maskedToken).toContain("****");
      expect(result.maskedToken).not.toContain("notion_access_token_valid");
    });

    it("detects expired tokens", () => {
      const result = NotionOAuth.validateToken(NotionFixtures.expiredToken());

      expect(result.valid).toBe(false);
      expect(result.issue).toBe("expired");
    });
  });

  describe("API Client", () => {
    it("defines Notion API metadata, quotas, and rate tiers", () => {
      expect(NotionClient.serviceName).toBe("Notion");
      expect(NotionClient.baseUrl).toContain("api.notion.com");
      expect(NotionClient.quotaDefinitions.length).toBeGreaterThan(0);
      expect(NotionClient.rateLimitTiers.length).toBeGreaterThan(0);
    });
  });

  describe("Resource Parser", () => {
    it("parses Notion page metadata", () => {
      const parsed = NotionParser.parse({
        id: "page-1",
        title: "Mission Brief",
        object: "page",
        url: "https://notion.so/page-1",
        created_time: BASE_TIME.toISOString(),
      });

      expect(parsed.id).toBe("page-1");
      expect(parsed.title).toBe("Mission Brief");
      expect(parsed.resourceType).toBe("page");
    });

    it("validates complete resources and rejects incomplete resources", () => {
      expect(NotionParser.validate(NotionFixtures.pageResource()).valid).toBe(true);
      expect(
        NotionParser.validate({
          id: "",
          title: "",
          resourceType: "page",
          url: "",
          createdAt: new Date("bad"),
        }).valid
      ).toBe(false);
    });

    it("redacts token query params from resource URLs", () => {
      const sanitized = NotionParser.sanitize({
        ...NotionFixtures.pageResource(),
        url: "https://api.notion.com/v1/pages/page-1?token=secret",
      });

      expect(sanitized.url).toContain("token=[redacted]");
      expect(sanitized.url).not.toContain("secret");
    });
  });

  describe("Action Set", () => {
    it("supports read and create page actions", () => {
      expect(NotionActions.supportedActions.map((action) => action.id)).toEqual([
        "notion_read",
        "notion_create_page",
      ]);
    });

    it("previews write actions with approval warnings", async () => {
      const preview = await NotionActions.preview({
        actionId: "notion_create_page",
        params: {},
        requestedBy: "operator",
        requestedAt: BASE_TIME,
      });

      expect(preview.requiresApproval).toBe(true);
      expect(preview.riskWarnings.join(" ")).toContain("approval");
    });

    it("queues approved actions when live execution is disabled", async () => {
      const receipt = await NotionActions.execute(NotionFixtures.approvedAction());

      expect(receipt.status).toBe("queued");
      expect(receipt.auditId).toContain("notion-audit");
    });
  });

  describe("Notion Reader", () => {
    let reader: NotionReader;

    beforeEach(() => {
      reader = new NotionReader();
    });

    it("stores, filters, and summarizes Notion resources deterministically", () => {
      reader.set("page", NotionFixtures.pageResource());
      reader.set("database", NotionFixtures.databaseResource());

      expect(reader.getByType("database")).toHaveLength(1);
      expect(reader.getSummary(BASE_TIME).total).toBe(2);
      expect(reader.getSummary(BASE_TIME)).toEqual(reader.getSummary(BASE_TIME));
    });
  });

  describe("Production Readiness", () => {
    it("is certification-ready until score reaches production threshold", () => {
      const readiness = getNotionProductionReadiness();

      expect(readiness.connectorId).toBe("notion");
      expect(readiness.priorityRank).toBe(6);
      expect(readiness.status).toBe("certification-ready");
      expect(readiness.missingCapabilities).toEqual([]);
    });

    it("uses deterministic retry and health projections", () => {
      expect(getNotionRetryPolicy().scheduleSeconds).toEqual([5, 10, 20]);

      const health = projectNotionHealth({
        currentTime: BASE_TIME,
        quotaUsedPercent: 30,
        tokenExpiresAt: new Date(BASE_TIME.getTime() + 60 * 60000),
      });

      expect(health.status).toBe("healthy");
      expect(health.checkedAt).toEqual(BASE_TIME);
    });
  });
});
