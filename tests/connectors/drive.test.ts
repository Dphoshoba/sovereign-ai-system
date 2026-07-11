import { describe, expect, it, beforeEach } from "vitest";
import { DriveActions } from "../../lib/connectors/drive/action-set";
import { DriveClient } from "../../lib/connectors/drive/api-client";
import { DriveOAuth } from "../../lib/connectors/drive/oauth-adapter";
import {
  getDriveProductionReadiness,
  getDriveRetryPolicy,
  projectDriveHealth,
} from "../../lib/connectors/drive/production-readiness";
import { DriveParser } from "../../lib/connectors/drive/resource-parser";
import { DriveReader } from "../../lib/gamma/drive-reader";
import { DriveFixtures } from "../fixtures/drive/drive-fixtures";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

describe("Drive Connector", () => {
  describe("OAuth Adapter", () => {
    it("defines Google Drive OAuth endpoints and scopes", () => {
      expect(DriveOAuth.authorizationUrl).toContain("accounts.google.com");
      expect(DriveOAuth.tokenUrl).toContain("oauth2.googleapis.com");
      expect(DriveOAuth.requiredScopes.length).toBeGreaterThan(0);
    });

    it("masks healthy tokens", () => {
      const result = DriveOAuth.validateToken({
        ...DriveFixtures.validToken(),
        expiresAt: new Date("2099-01-01T00:00:00.000Z"),
      });

      expect(result.valid).toBe(true);
      expect(result.maskedToken).toContain("****");
      expect(result.maskedToken).not.toContain("drive_access_token_valid");
    });

    it("detects expired tokens", () => {
      const result = DriveOAuth.validateToken(DriveFixtures.expiredToken());

      expect(result.valid).toBe(false);
      expect(result.issue).toBe("expired");
    });
  });

  describe("API Client", () => {
    it("defines Drive API metadata, quotas, and rate tiers", () => {
      expect(DriveClient.serviceName).toBe("Google Drive");
      expect(DriveClient.baseUrl).toContain("drive/v3");
      expect(DriveClient.quotaDefinitions.length).toBeGreaterThan(0);
      expect(DriveClient.rateLimitTiers.length).toBeGreaterThan(0);
    });
  });

  describe("Resource Parser", () => {
    it("parses Drive file metadata", () => {
      const parsed = DriveParser.parse({
        id: "file-1",
        name: "Proposal",
        mimeType: "application/pdf",
        createdTime: BASE_TIME.toISOString(),
        owners: ["owner@example.com"],
      });

      expect(parsed.id).toBe("file-1");
      expect(parsed.name).toBe("Proposal");
      expect(parsed.owners).toEqual(["owner@example.com"]);
    });

    it("validates complete resources and rejects incomplete resources", () => {
      expect(DriveParser.validate(DriveFixtures.validResource()).valid).toBe(true);
      expect(
        DriveParser.validate({
          id: "",
          name: "",
          mimeType: "",
          createdAt: new Date("bad"),
          owners: [],
        }).valid
      ).toBe(false);
    });

    it("sanitizes owner email addresses", () => {
      const sanitized = DriveParser.sanitize(DriveFixtures.validResource());

      expect(sanitized.owners[0]).toBe("d***@example.com");
    });
  });

  describe("Action Set", () => {
    it("supports read and create actions", () => {
      expect(DriveActions.supportedActions.map((action) => action.id)).toEqual([
        "drive_read",
        "drive_create",
      ]);
    });

    it("previews write actions with approval warnings", async () => {
      const preview = await DriveActions.preview({
        actionId: "drive_create",
        params: {},
        requestedBy: "operator",
        requestedAt: BASE_TIME,
      });

      expect(preview.requiresApproval).toBe(true);
      expect(preview.riskWarnings.join(" ")).toContain("approval");
    });

    it("queues approved actions when live execution is disabled", async () => {
      const receipt = await DriveActions.execute(DriveFixtures.approvedAction());

      expect(receipt.status).toBe("queued");
      expect(receipt.auditId).toContain("drive-audit");
    });
  });

  describe("Drive Reader", () => {
    let reader: DriveReader;

    beforeEach(() => {
      reader = new DriveReader();
    });

    it("stores, filters, and summarizes Drive resources deterministically", () => {
      reader.set("file", DriveFixtures.validResource());
      reader.set("folder", DriveFixtures.folderResource());

      expect(reader.getByMimeType("application/vnd.google-apps.folder")).toHaveLength(1);
      expect(reader.getSummary(BASE_TIME).total).toBe(2);
      expect(reader.getSummary(BASE_TIME)).toEqual(reader.getSummary(BASE_TIME));
    });
  });

  describe("Production Readiness", () => {
    it("is certification-ready until score reaches production threshold", () => {
      const readiness = getDriveProductionReadiness();

      expect(readiness.connectorId).toBe("drive");
      expect(readiness.priorityRank).toBe(3);
      expect(readiness.status).toBe("certification-ready");
      expect(readiness.missingCapabilities).toEqual([]);
    });

    it("uses deterministic retry and health projections", () => {
      expect(getDriveRetryPolicy().scheduleSeconds).toEqual([5, 10, 20]);

      const health = projectDriveHealth({
        currentTime: BASE_TIME,
        quotaUsedPercent: 30,
        tokenExpiresAt: new Date(BASE_TIME.getTime() + 60 * 60000),
      });

      expect(health.status).toBe("healthy");
      expect(health.checkedAt).toEqual(BASE_TIME);
    });
  });
});
