import { describe, expect, it, beforeEach } from "vitest";
import { SalesforceActions } from "../../lib/connectors/salesforce/action-set";
import { SalesforceClient } from "../../lib/connectors/salesforce/api-client";
import { SalesforceOAuth } from "../../lib/connectors/salesforce/oauth-adapter";
import {
  getSalesforceProductionReadiness,
  getSalesforceRetryPolicy,
  projectSalesforceHealth,
} from "../../lib/connectors/salesforce/production-readiness";
import { SalesforceParser } from "../../lib/connectors/salesforce/resource-parser";
import { SalesforceReader } from "../../lib/gamma/salesforce-reader";
import { SalesforceFixtures } from "../fixtures/salesforce/salesforce-fixtures";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

describe("Salesforce Connector", () => {
  describe("OAuth Adapter", () => {
    it("defines Salesforce OAuth endpoints and scopes", () => {
      expect(SalesforceOAuth.authorizationUrl).toContain("salesforce.com");
      expect(SalesforceOAuth.tokenUrl).toContain("salesforce.com");
      expect(SalesforceOAuth.requiredScopes).toContain("api");
      expect(SalesforceOAuth.requiredScopes).toContain("refresh_token");
    });

    it("masks healthy tokens", () => {
      const result = SalesforceOAuth.validateToken({
        ...SalesforceFixtures.validToken(),
        expiresAt: new Date("2099-01-01T00:00:00.000Z"),
      });

      expect(result.valid).toBe(true);
      expect(result.maskedToken).toContain("****");
      expect(result.maskedToken).not.toContain("salesforce_access_token_valid");
    });

    it("detects expired tokens", () => {
      const result = SalesforceOAuth.validateToken(SalesforceFixtures.expiredToken());

      expect(result.valid).toBe(false);
      expect(result.issue).toBe("expired");
    });
  });

  describe("API Client", () => {
    it("defines Salesforce API metadata, quotas, and rate tiers", () => {
      expect(SalesforceClient.serviceName).toBe("Salesforce");
      expect(SalesforceClient.baseUrl).toContain("salesforce.com");
      expect(SalesforceClient.quotaDefinitions.length).toBeGreaterThan(0);
      expect(SalesforceClient.rateLimitTiers.length).toBeGreaterThan(0);
    });
  });

  describe("Resource Parser", () => {
    it("parses Salesforce opportunity metadata", () => {
      const parsed = SalesforceParser.parse({
        Id: "006000000000002AAA",
        Name: "Mission Opportunity",
        type: "opportunity",
        StageName: "Qualification",
        Amount: 12500,
        CreatedDate: BASE_TIME.toISOString(),
      });

      expect(parsed.id).toBe("006000000000002AAA");
      expect(parsed.name).toBe("Mission Opportunity");
      expect(parsed.resourceType).toBe("opportunity");
      expect(parsed.stageName).toBe("Qualification");
      expect(parsed.amountCents).toBe(1250000);
    });

    it("validates complete resources and rejects incomplete resources", () => {
      expect(SalesforceParser.validate(SalesforceFixtures.accountResource()).valid).toBe(true);
      expect(
        SalesforceParser.validate({
          id: "",
          name: "",
          resourceType: "account",
          createdAt: new Date("bad"),
        }).valid
      ).toBe(false);
    });

    it("redacts Salesforce IDs from names", () => {
      const sanitized = SalesforceParser.sanitize({
        ...SalesforceFixtures.accountResource(),
        name: "Account 001000000000001AAA",
      });

      expect(sanitized.name).toContain("[salesforce-id-redacted]");
      expect(sanitized.name).not.toContain("001000000000001AAA");
    });
  });

  describe("Action Set", () => {
    it("supports read and create record actions", () => {
      expect(SalesforceActions.supportedActions.map((action) => action.id)).toEqual([
        "salesforce_read",
        "salesforce_create_record",
      ]);
    });

    it("previews CRM write actions with approval warnings", async () => {
      const preview = await SalesforceActions.preview({
        actionId: "salesforce_create_record",
        params: {},
        requestedBy: "operator",
        requestedAt: BASE_TIME,
      });

      expect(preview.requiresApproval).toBe(true);
      expect(preview.riskWarnings.join(" ")).toContain("approval");
    });

    it("queues approved CRM write actions when live execution is disabled", async () => {
      const receipt = await SalesforceActions.execute(SalesforceFixtures.approvedAction());

      expect(receipt.status).toBe("queued");
      expect(receipt.auditId).toContain("salesforce-audit");
    });
  });

  describe("Salesforce Reader", () => {
    let reader: SalesforceReader;

    beforeEach(() => {
      reader = new SalesforceReader();
    });

    it("stores, filters, and summarizes Salesforce resources deterministically", () => {
      reader.set("account", SalesforceFixtures.accountResource());
      reader.set("opportunity", SalesforceFixtures.opportunityResource());

      expect(reader.getByType("opportunity")).toHaveLength(1);
      expect(reader.getSummary(BASE_TIME).projectedPipelineCents).toBe(2500000);
      expect(reader.getSummary(BASE_TIME)).toEqual(reader.getSummary(BASE_TIME));
    });
  });

  describe("Production Readiness", () => {
    it("is certification-ready until score reaches production threshold", () => {
      const readiness = getSalesforceProductionReadiness();

      expect(readiness.connectorId).toBe("salesforce");
      expect(readiness.priorityRank).toBe(10);
      expect(readiness.status).toBe("certification-ready");
      expect(readiness.missingCapabilities).toEqual([]);
    });

    it("uses deterministic retry and health projections", () => {
      expect(getSalesforceRetryPolicy().scheduleSeconds).toEqual([5, 10, 20]);

      const health = projectSalesforceHealth({
        currentTime: BASE_TIME,
        quotaUsedPercent: 30,
        tokenExpiresAt: new Date(BASE_TIME.getTime() + 60 * 60000),
      });

      expect(health.status).toBe("healthy");
      expect(health.checkedAt).toEqual(BASE_TIME);
    });
  });
});
