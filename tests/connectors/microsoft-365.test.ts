import { describe, expect, it, beforeEach } from "vitest";
import { Microsoft365Actions } from "../../lib/connectors/microsoft-365/action-set";
import { Microsoft365Client } from "../../lib/connectors/microsoft-365/api-client";
import { Microsoft365OAuth } from "../../lib/connectors/microsoft-365/oauth-adapter";
import {
  getMicrosoft365ProductionReadiness,
  getMicrosoft365RetryPolicy,
  projectMicrosoft365Health,
} from "../../lib/connectors/microsoft-365/production-readiness";
import { Microsoft365Parser } from "../../lib/connectors/microsoft-365/resource-parser";
import { Microsoft365Reader } from "../../lib/gamma/microsoft-365-reader";
import { Microsoft365Fixtures } from "../fixtures/microsoft-365/microsoft-365-fixtures";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

describe("Microsoft 365 Connector", () => {
  describe("OAuth Adapter", () => {
    it("defines Microsoft OAuth endpoints and scopes", () => {
      expect(Microsoft365OAuth.authorizationUrl).toContain("microsoftonline.com");
      expect(Microsoft365OAuth.tokenUrl).toContain("microsoftonline.com");
      expect(Microsoft365OAuth.requiredScopes).toContain("User.Read");
    });

    it("masks healthy tokens", () => {
      const result = Microsoft365OAuth.validateToken({
        ...Microsoft365Fixtures.validToken(),
        expiresAt: new Date("2099-01-01T00:00:00.000Z"),
      });

      expect(result.valid).toBe(true);
      expect(result.maskedToken).toContain("****");
      expect(result.maskedToken).not.toContain("microsoft365_access_token_valid");
    });

    it("detects expired tokens", () => {
      const result = Microsoft365OAuth.validateToken(Microsoft365Fixtures.expiredToken());

      expect(result.valid).toBe(false);
      expect(result.issue).toBe("expired");
    });
  });

  describe("API Client", () => {
    it("defines Microsoft Graph metadata, quotas, and rate tiers", () => {
      expect(Microsoft365Client.serviceName).toBe("Microsoft 365");
      expect(Microsoft365Client.baseUrl).toContain("graph.microsoft.com");
      expect(Microsoft365Client.quotaDefinitions.length).toBeGreaterThan(0);
      expect(Microsoft365Client.rateLimitTiers.length).toBeGreaterThan(0);
    });
  });

  describe("Resource Parser", () => {
    it("parses Microsoft Graph mail metadata", () => {
      const parsed = Microsoft365Parser.parse({
        id: "mail-1",
        subject: "Mission Brief",
        resourceType: "mail",
        webUrl: "https://outlook.office.com/mail/item/mail-1",
        createdDateTime: BASE_TIME.toISOString(),
      });

      expect(parsed.id).toBe("mail-1");
      expect(parsed.name).toBe("Mission Brief");
      expect(parsed.resourceType).toBe("mail");
    });

    it("validates complete resources and rejects incomplete resources", () => {
      expect(Microsoft365Parser.validate(Microsoft365Fixtures.mailResource()).valid).toBe(true);
      expect(
        Microsoft365Parser.validate({
          id: "",
          name: "",
          resourceType: "mail",
          webUrl: "",
          createdAt: new Date("bad"),
        }).valid
      ).toBe(false);
    });

    it("redacts access tokens from resource URLs", () => {
      const sanitized = Microsoft365Parser.sanitize({
        ...Microsoft365Fixtures.mailResource(),
        webUrl: "https://graph.microsoft.com/v1.0/me/messages/1?access_token=secret",
      });

      expect(sanitized.webUrl).toContain("access_token=[redacted]");
      expect(sanitized.webUrl).not.toContain("secret");
    });
  });

  describe("Action Set", () => {
    it("supports read and create actions", () => {
      expect(Microsoft365Actions.supportedActions.map((action) => action.id)).toEqual([
        "microsoft365_read",
        "microsoft365_create",
      ]);
    });

    it("previews write actions with approval warnings", async () => {
      const preview = await Microsoft365Actions.preview({
        actionId: "microsoft365_create",
        params: {},
        requestedBy: "operator",
        requestedAt: BASE_TIME,
      });

      expect(preview.requiresApproval).toBe(true);
      expect(preview.riskWarnings.join(" ")).toContain("approval");
    });

    it("queues approved actions when live execution is disabled", async () => {
      const receipt = await Microsoft365Actions.execute(Microsoft365Fixtures.approvedAction());

      expect(receipt.status).toBe("queued");
      expect(receipt.auditId).toContain("microsoft365-audit");
    });
  });

  describe("Microsoft365 Reader", () => {
    let reader: Microsoft365Reader;

    beforeEach(() => {
      reader = new Microsoft365Reader();
    });

    it("stores, filters, and summarizes Microsoft 365 resources deterministically", () => {
      reader.set("mail", Microsoft365Fixtures.mailResource());
      reader.set("file", Microsoft365Fixtures.fileResource());

      expect(reader.getByType("file")).toHaveLength(1);
      expect(reader.getSummary(BASE_TIME).total).toBe(2);
      expect(reader.getSummary(BASE_TIME)).toEqual(reader.getSummary(BASE_TIME));
    });
  });

  describe("Production Readiness", () => {
    it("is certification-ready until score reaches production threshold", () => {
      const readiness = getMicrosoft365ProductionReadiness();

      expect(readiness.connectorId).toBe("microsoft-365");
      expect(readiness.priorityRank).toBe(7);
      expect(readiness.status).toBe("certification-ready");
      expect(readiness.missingCapabilities).toEqual([]);
    });

    it("uses deterministic retry and health projections", () => {
      expect(getMicrosoft365RetryPolicy().scheduleSeconds).toEqual([5, 10, 20]);

      const health = projectMicrosoft365Health({
        currentTime: BASE_TIME,
        quotaUsedPercent: 30,
        tokenExpiresAt: new Date(BASE_TIME.getTime() + 60 * 60000),
      });

      expect(health.status).toBe("healthy");
      expect(health.checkedAt).toEqual(BASE_TIME);
    });
  });
});
