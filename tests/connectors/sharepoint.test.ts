import { describe, expect, it, beforeEach } from "vitest";
import { SharePointActions } from "../../lib/connectors/sharepoint/action-set";
import { SharePointClient } from "../../lib/connectors/sharepoint/api-client";
import { SharePointOAuth } from "../../lib/connectors/sharepoint/oauth-adapter";
import {
  getSharePointProductionReadiness,
  getSharePointRetryPolicy,
  projectSharePointHealth,
} from "../../lib/connectors/sharepoint/production-readiness";
import { SharePointParser } from "../../lib/connectors/sharepoint/resource-parser";
import { SharePointReader } from "../../lib/gamma/sharepoint-reader";
import { SharePointFixtures } from "../fixtures/sharepoint/sharepoint-fixtures";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

describe("SharePoint Connector", () => {
  describe("OAuth Adapter", () => {
    it("defines Microsoft OAuth endpoints and SharePoint scopes", () => {
      expect(SharePointOAuth.authorizationUrl).toContain("microsoftonline.com");
      expect(SharePointOAuth.tokenUrl).toContain("microsoftonline.com");
      expect(SharePointOAuth.requiredScopes).toContain("Sites.Read.All");
    });

    it("masks healthy tokens", () => {
      const result = SharePointOAuth.validateToken({
        ...SharePointFixtures.validToken(),
        expiresAt: new Date("2099-01-01T00:00:00.000Z"),
      });

      expect(result.valid).toBe(true);
      expect(result.maskedToken).toContain("****");
      expect(result.maskedToken).not.toContain("sharepoint_access_token_valid");
    });

    it("detects expired tokens", () => {
      const result = SharePointOAuth.validateToken(SharePointFixtures.expiredToken());

      expect(result.valid).toBe(false);
      expect(result.issue).toBe("expired");
    });
  });

  describe("API Client", () => {
    it("defines SharePoint API metadata, quotas, and rate tiers", () => {
      expect(SharePointClient.serviceName).toBe("SharePoint");
      expect(SharePointClient.baseUrl).toContain("graph.microsoft.com");
      expect(SharePointClient.quotaDefinitions.length).toBeGreaterThan(0);
      expect(SharePointClient.rateLimitTiers.length).toBeGreaterThan(0);
    });
  });

  describe("Resource Parser", () => {
    it("parses SharePoint list metadata", () => {
      const parsed = SharePointParser.parse({
        id: "list-002",
        displayName: "Mission List",
        type: "list",
        itemCount: 15,
        webUrl: "https://contoso.sharepoint.com/sites/mission/lists/list-002",
        lastModifiedDateTime: BASE_TIME.toISOString(),
      });

      expect(parsed.id).toBe("list-002");
      expect(parsed.name).toBe("Mission List");
      expect(parsed.resourceType).toBe("list");
      expect(parsed.itemCount).toBe(15);
    });

    it("validates complete resources and rejects incomplete resources", () => {
      expect(SharePointParser.validate(SharePointFixtures.siteResource()).valid).toBe(true);
      expect(
        SharePointParser.validate({
          id: "",
          name: "",
          resourceType: "site",
          modifiedAt: new Date("bad"),
        }).valid
      ).toBe(false);
    });

    it("redacts SharePoint sharing tokens from web URLs", () => {
      const sanitized = SharePointParser.sanitize({
        ...SharePointFixtures.siteResource(),
        webUrl: "https://example.test/site?e=abcdef123456",
      });

      expect(sanitized.webUrl).toContain("e=[redacted]");
      expect(sanitized.webUrl).not.toContain("abcdef123456");
    });
  });

  describe("Action Set", () => {
    it("supports read and create list item actions", () => {
      expect(SharePointActions.supportedActions.map((action) => action.id)).toEqual([
        "sharepoint_read",
        "sharepoint_create_list_item",
      ]);
    });

    it("previews list writes with approval warnings", async () => {
      const preview = await SharePointActions.preview({
        actionId: "sharepoint_create_list_item",
        params: {},
        requestedBy: "operator",
        requestedAt: BASE_TIME,
      });

      expect(preview.requiresApproval).toBe(true);
      expect(preview.riskWarnings.join(" ")).toContain("approval");
    });

    it("queues approved list writes when live execution is disabled", async () => {
      const receipt = await SharePointActions.execute(SharePointFixtures.approvedAction());

      expect(receipt.status).toBe("queued");
      expect(receipt.auditId).toContain("sharepoint-audit");
    });
  });

  describe("SharePoint Reader", () => {
    let reader: SharePointReader;

    beforeEach(() => {
      reader = new SharePointReader();
    });

    it("stores, filters, and summarizes SharePoint resources deterministically", () => {
      reader.set("site", SharePointFixtures.siteResource());
      reader.set("list", SharePointFixtures.listResource());

      expect(reader.getByType("list")).toHaveLength(1);
      expect(reader.getSummary(BASE_TIME).totalItemCount).toBe(42);
      expect(reader.getSummary(BASE_TIME)).toEqual(reader.getSummary(BASE_TIME));
    });
  });

  describe("Production Readiness", () => {
    it("is certification-ready until score reaches production threshold", () => {
      const readiness = getSharePointProductionReadiness();

      expect(readiness.connectorId).toBe("sharepoint");
      expect(readiness.priorityRank).toBe(14);
      expect(readiness.status).toBe("certification-ready");
      expect(readiness.missingCapabilities).toEqual([]);
    });

    it("uses deterministic retry and health projections", () => {
      expect(getSharePointRetryPolicy().scheduleSeconds).toEqual([5, 10, 20]);

      const health = projectSharePointHealth({
        currentTime: BASE_TIME,
        quotaUsedPercent: 30,
        tokenExpiresAt: new Date(BASE_TIME.getTime() + 60 * 60000),
      });

      expect(health.status).toBe("healthy");
      expect(health.checkedAt).toEqual(BASE_TIME);
    });
  });
});
