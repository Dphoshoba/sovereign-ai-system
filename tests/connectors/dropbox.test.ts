import { describe, expect, it, beforeEach } from "vitest";
import { DropboxActions } from "../../lib/connectors/dropbox/action-set";
import { DropboxClient } from "../../lib/connectors/dropbox/api-client";
import { DropboxOAuth } from "../../lib/connectors/dropbox/oauth-adapter";
import {
  getDropboxProductionReadiness,
  getDropboxRetryPolicy,
  projectDropboxHealth,
} from "../../lib/connectors/dropbox/production-readiness";
import { DropboxParser } from "../../lib/connectors/dropbox/resource-parser";
import { DropboxReader } from "../../lib/gamma/dropbox-reader";
import { DropboxFixtures } from "../fixtures/dropbox/dropbox-fixtures";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

describe("Dropbox Connector", () => {
  describe("OAuth Adapter", () => {
    it("defines Dropbox OAuth endpoints and scopes", () => {
      expect(DropboxOAuth.authorizationUrl).toContain("dropbox.com");
      expect(DropboxOAuth.tokenUrl).toContain("dropboxapi.com");
      expect(DropboxOAuth.requiredScopes).toContain("files.metadata.read");
    });

    it("masks healthy tokens", () => {
      const result = DropboxOAuth.validateToken({
        ...DropboxFixtures.validToken(),
        expiresAt: new Date("2099-01-01T00:00:00.000Z"),
      });

      expect(result.valid).toBe(true);
      expect(result.maskedToken).toContain("****");
      expect(result.maskedToken).not.toContain("dropbox_access_token_valid");
    });

    it("detects expired tokens", () => {
      const result = DropboxOAuth.validateToken(DropboxFixtures.expiredToken());

      expect(result.valid).toBe(false);
      expect(result.issue).toBe("expired");
    });
  });

  describe("API Client", () => {
    it("defines Dropbox API metadata, quotas, and rate tiers", () => {
      expect(DropboxClient.serviceName).toBe("Dropbox");
      expect(DropboxClient.baseUrl).toContain("dropboxapi.com");
      expect(DropboxClient.quotaDefinitions.length).toBeGreaterThan(0);
      expect(DropboxClient.rateLimitTiers.length).toBeGreaterThan(0);
    });
  });

  describe("Resource Parser", () => {
    it("parses Dropbox file metadata", () => {
      const parsed = DropboxParser.parse({
        id: "id:file-002",
        name: "Mission Brief.pdf",
        ".tag": "file",
        path_lower: "/mission/brief.pdf",
        size: 4096,
        server_modified: BASE_TIME.toISOString(),
      });

      expect(parsed.id).toBe("id:file-002");
      expect(parsed.name).toBe("Mission Brief.pdf");
      expect(parsed.resourceType).toBe("file");
      expect(parsed.sizeBytes).toBe(4096);
    });

    it("validates complete resources and rejects incomplete resources", () => {
      expect(DropboxParser.validate(DropboxFixtures.fileResource()).valid).toBe(true);
      expect(
        DropboxParser.validate({
          id: "",
          name: "",
          resourceType: "file",
          modifiedAt: new Date("bad"),
        }).valid
      ).toBe(false);
    });

    it("redacts Dropbox shared-link tokens from names", () => {
      const sanitized = DropboxParser.sanitize({
        ...DropboxFixtures.fileResource(),
        name: "token sl.ABC123_secret",
      });

      expect(sanitized.name).toContain("sl.[redacted]");
      expect(sanitized.name).not.toContain("ABC123_secret");
    });
  });

  describe("Action Set", () => {
    it("supports read and upload actions", () => {
      expect(DropboxActions.supportedActions.map((action) => action.id)).toEqual([
        "dropbox_read",
        "dropbox_upload_file",
      ]);
    });

    it("previews file writes with approval warnings", async () => {
      const preview = await DropboxActions.preview({
        actionId: "dropbox_upload_file",
        params: {},
        requestedBy: "operator",
        requestedAt: BASE_TIME,
      });

      expect(preview.requiresApproval).toBe(true);
      expect(preview.riskWarnings.join(" ")).toContain("approval");
    });

    it("queues approved file writes when live execution is disabled", async () => {
      const receipt = await DropboxActions.execute(DropboxFixtures.approvedAction());

      expect(receipt.status).toBe("queued");
      expect(receipt.auditId).toContain("dropbox-audit");
    });
  });

  describe("Dropbox Reader", () => {
    let reader: DropboxReader;

    beforeEach(() => {
      reader = new DropboxReader();
    });

    it("stores, filters, and summarizes Dropbox resources deterministically", () => {
      reader.set("file", DropboxFixtures.fileResource());
      reader.set("folder", DropboxFixtures.folderResource());

      expect(reader.getByType("file")).toHaveLength(1);
      expect(reader.getSummary(BASE_TIME).totalSizeBytes).toBe(2048);
      expect(reader.getSummary(BASE_TIME)).toEqual(reader.getSummary(BASE_TIME));
    });
  });

  describe("Production Readiness", () => {
    it("is certification-ready until score reaches production threshold", () => {
      const readiness = getDropboxProductionReadiness();

      expect(readiness.connectorId).toBe("dropbox");
      expect(readiness.priorityRank).toBe(12);
      expect(readiness.status).toBe("certification-ready");
      expect(readiness.missingCapabilities).toEqual([]);
    });

    it("uses deterministic retry and health projections", () => {
      expect(getDropboxRetryPolicy().scheduleSeconds).toEqual([5, 10, 20]);

      const health = projectDropboxHealth({
        currentTime: BASE_TIME,
        quotaUsedPercent: 30,
        tokenExpiresAt: new Date(BASE_TIME.getTime() + 60 * 60000),
      });

      expect(health.status).toBe("healthy");
      expect(health.checkedAt).toEqual(BASE_TIME);
    });
  });
});
