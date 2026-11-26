import { describe, expect, it, beforeEach } from "vitest";
import { OneDriveActions } from "../../lib/connectors/onedrive/action-set";
import { OneDriveClient } from "../../lib/connectors/onedrive/api-client";
import { OneDriveOAuth } from "../../lib/connectors/onedrive/oauth-adapter";
import {
  getOneDriveProductionReadiness,
  getOneDriveRetryPolicy,
  projectOneDriveHealth,
} from "../../lib/connectors/onedrive/production-readiness";
import { OneDriveParser } from "../../lib/connectors/onedrive/resource-parser";
import { OneDriveReader } from "../../lib/gamma/onedrive-reader";
import { OneDriveFixtures } from "../fixtures/onedrive/onedrive-fixtures";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

describe("OneDrive Connector", () => {
  describe("OAuth Adapter", () => {
    it("defines Microsoft OAuth endpoints and OneDrive scopes", () => {
      expect(OneDriveOAuth.authorizationUrl).toContain("microsoftonline.com");
      expect(OneDriveOAuth.tokenUrl).toContain("microsoftonline.com");
      expect(OneDriveOAuth.requiredScopes).toContain("Files.Read");
    });

    it("masks healthy tokens", () => {
      const result = OneDriveOAuth.validateToken({
        ...OneDriveFixtures.validToken(),
        expiresAt: new Date("2099-01-01T00:00:00.000Z"),
      });

      expect(result.valid).toBe(true);
      expect(result.maskedToken).toContain("****");
      expect(result.maskedToken).not.toContain("onedrive_access_token_valid");
    });

    it("detects expired tokens", () => {
      const result = OneDriveOAuth.validateToken(OneDriveFixtures.expiredToken());

      expect(result.valid).toBe(false);
      expect(result.issue).toBe("expired");
    });
  });

  describe("API Client", () => {
    it("defines OneDrive API metadata, quotas, and rate tiers", () => {
      expect(OneDriveClient.serviceName).toBe("OneDrive");
      expect(OneDriveClient.baseUrl).toContain("graph.microsoft.com");
      expect(OneDriveClient.quotaDefinitions.length).toBeGreaterThan(0);
      expect(OneDriveClient.rateLimitTiers.length).toBeGreaterThan(0);
    });
  });

  describe("Resource Parser", () => {
    it("parses OneDrive file metadata", () => {
      const parsed = OneDriveParser.parse({
        id: "file-002",
        name: "Mission Brief.pdf",
        file: { mimeType: "application/pdf" },
        size: 8192,
        lastModifiedDateTime: BASE_TIME.toISOString(),
      });

      expect(parsed.id).toBe("file-002");
      expect(parsed.name).toBe("Mission Brief.pdf");
      expect(parsed.resourceType).toBe("file");
      expect(parsed.sizeBytes).toBe(8192);
    });

    it("validates complete resources and rejects incomplete resources", () => {
      expect(OneDriveParser.validate(OneDriveFixtures.fileResource()).valid).toBe(true);
      expect(
        OneDriveParser.validate({
          id: "",
          name: "",
          resourceType: "file",
          modifiedAt: new Date("bad"),
        }).valid
      ).toBe(false);
    });

    it("redacts OneDrive auth keys from web URLs", () => {
      const sanitized = OneDriveParser.sanitize({
        ...OneDriveFixtures.fileResource(),
        webUrl: "https://example.test/file?authkey=secret-token",
      });

      expect(sanitized.webUrl).toContain("authkey=[redacted]");
      expect(sanitized.webUrl).not.toContain("secret-token");
    });
  });

  describe("Action Set", () => {
    it("supports read and upload actions", () => {
      expect(OneDriveActions.supportedActions.map((action) => action.id)).toEqual([
        "onedrive_read",
        "onedrive_upload_file",
      ]);
    });

    it("previews file writes with approval warnings", async () => {
      const preview = await OneDriveActions.preview({
        actionId: "onedrive_upload_file",
        params: {},
        requestedBy: "operator",
        requestedAt: BASE_TIME,
      });

      expect(preview.requiresApproval).toBe(true);
      expect(preview.riskWarnings.join(" ")).toContain("approval");
    });

    it("queues approved file writes when live execution is disabled", async () => {
      const receipt = await OneDriveActions.execute(OneDriveFixtures.approvedAction());

      expect(receipt.status).toBe("queued");
      expect(receipt.auditId).toContain("onedrive-audit");
    });
  });

  describe("OneDrive Reader", () => {
    let reader: OneDriveReader;

    beforeEach(() => {
      reader = new OneDriveReader();
    });

    it("stores, filters, and summarizes OneDrive resources deterministically", () => {
      reader.set("file", OneDriveFixtures.fileResource());
      reader.set("folder", OneDriveFixtures.folderResource());

      expect(reader.getByType("file")).toHaveLength(1);
      expect(reader.getSummary(BASE_TIME).totalSizeBytes).toBe(4096);
      expect(reader.getSummary(BASE_TIME)).toEqual(reader.getSummary(BASE_TIME));
    });
  });

  describe("Production Readiness", () => {
    it("is certification-ready until score reaches production threshold", () => {
      const readiness = getOneDriveProductionReadiness();

      expect(readiness.connectorId).toBe("onedrive");
      expect(readiness.priorityRank).toBe(13);
      expect(readiness.status).toBe("certification-ready");
      expect(readiness.missingCapabilities).toEqual([]);
    });

    it("uses deterministic retry and health projections", () => {
      expect(getOneDriveRetryPolicy().scheduleSeconds).toEqual([5, 10, 20]);

      const health = projectOneDriveHealth({
        currentTime: BASE_TIME,
        quotaUsedPercent: 30,
        tokenExpiresAt: new Date(BASE_TIME.getTime() + 60 * 60000),
      });

      expect(health.status).toBe("healthy");
      expect(health.checkedAt).toEqual(BASE_TIME);
    });
  });
});
