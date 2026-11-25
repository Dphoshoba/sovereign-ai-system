import { describe, expect, it, beforeEach } from "vitest";
import { HubSpotActions } from "../../lib/connectors/hubspot/action-set";
import { HubSpotClient } from "../../lib/connectors/hubspot/api-client";
import { HubSpotOAuth } from "../../lib/connectors/hubspot/oauth-adapter";
import {
  getHubSpotProductionReadiness,
  getHubSpotRetryPolicy,
  projectHubSpotHealth,
} from "../../lib/connectors/hubspot/production-readiness";
import { HubSpotParser } from "../../lib/connectors/hubspot/resource-parser";
import { HubSpotReader } from "../../lib/gamma/hubspot-reader";
import { HubSpotFixtures } from "../fixtures/hubspot/hubspot-fixtures";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

describe("HubSpot Connector", () => {
  describe("OAuth Adapter", () => {
    it("defines HubSpot OAuth endpoints and scopes", () => {
      expect(HubSpotOAuth.authorizationUrl).toContain("hubspot.com");
      expect(HubSpotOAuth.tokenUrl).toContain("hubapi.com");
      expect(HubSpotOAuth.requiredScopes).toContain("crm.objects.contacts.read");
    });

    it("masks healthy tokens", () => {
      const result = HubSpotOAuth.validateToken({
        ...HubSpotFixtures.validToken(),
        expiresAt: new Date("2099-01-01T00:00:00.000Z"),
      });

      expect(result.valid).toBe(true);
      expect(result.maskedToken).toContain("****");
      expect(result.maskedToken).not.toContain("hubspot_access_token_valid");
    });

    it("detects expired tokens", () => {
      const result = HubSpotOAuth.validateToken(HubSpotFixtures.expiredToken());

      expect(result.valid).toBe(false);
      expect(result.issue).toBe("expired");
    });
  });

  describe("API Client", () => {
    it("defines HubSpot API metadata, quotas, and rate tiers", () => {
      expect(HubSpotClient.serviceName).toBe("HubSpot");
      expect(HubSpotClient.baseUrl).toContain("hubapi.com");
      expect(HubSpotClient.quotaDefinitions.length).toBeGreaterThan(0);
      expect(HubSpotClient.rateLimitTiers.length).toBeGreaterThan(0);
    });
  });

  describe("Resource Parser", () => {
    it("parses HubSpot deal metadata", () => {
      const parsed = HubSpotParser.parse({
        id: "303",
        objectType: "deal",
        createdAt: BASE_TIME.toISOString(),
        properties: {
          dealname: "Mission Deal",
          dealstage: "qualifiedtobuy",
          amount: "12500",
        },
      });

      expect(parsed.id).toBe("303");
      expect(parsed.name).toBe("Mission Deal");
      expect(parsed.resourceType).toBe("deal");
      expect(parsed.pipelineStage).toBe("qualifiedtobuy");
      expect(parsed.amountCents).toBe(1250000);
    });

    it("validates complete resources and rejects incomplete resources", () => {
      expect(HubSpotParser.validate(HubSpotFixtures.contactResource()).valid).toBe(true);
      expect(
        HubSpotParser.validate({
          id: "",
          name: "",
          resourceType: "contact",
          createdAt: new Date("bad"),
        }).valid
      ).toBe(false);
    });

    it("redacts HubSpot private app tokens from names", () => {
      const sanitized = HubSpotParser.sanitize({
        ...HubSpotFixtures.contactResource(),
        name: "Token pat-na1-1234567890abcdef",
      });

      expect(sanitized.name).toContain("pat-[redacted]");
      expect(sanitized.name).not.toContain("1234567890abcdef");
    });
  });

  describe("Action Set", () => {
    it("supports read and create record actions", () => {
      expect(HubSpotActions.supportedActions.map((action) => action.id)).toEqual([
        "hubspot_read",
        "hubspot_create_record",
      ]);
    });

    it("previews CRM write actions with approval warnings", async () => {
      const preview = await HubSpotActions.preview({
        actionId: "hubspot_create_record",
        params: {},
        requestedBy: "operator",
        requestedAt: BASE_TIME,
      });

      expect(preview.requiresApproval).toBe(true);
      expect(preview.riskWarnings.join(" ")).toContain("approval");
    });

    it("queues approved CRM write actions when live execution is disabled", async () => {
      const receipt = await HubSpotActions.execute(HubSpotFixtures.approvedAction());

      expect(receipt.status).toBe("queued");
      expect(receipt.auditId).toContain("hubspot-audit");
    });
  });

  describe("HubSpot Reader", () => {
    let reader: HubSpotReader;

    beforeEach(() => {
      reader = new HubSpotReader();
    });

    it("stores, filters, and summarizes HubSpot resources deterministically", () => {
      reader.set("contact", HubSpotFixtures.contactResource());
      reader.set("deal", HubSpotFixtures.dealResource());

      expect(reader.getByType("deal")).toHaveLength(1);
      expect(reader.getSummary(BASE_TIME).projectedDealValueCents).toBe(1800000);
      expect(reader.getSummary(BASE_TIME)).toEqual(reader.getSummary(BASE_TIME));
    });
  });

  describe("Production Readiness", () => {
    it("is certification-ready until score reaches production threshold", () => {
      const readiness = getHubSpotProductionReadiness();

      expect(readiness.connectorId).toBe("hubspot");
      expect(readiness.priorityRank).toBe(11);
      expect(readiness.status).toBe("certification-ready");
      expect(readiness.missingCapabilities).toEqual([]);
    });

    it("uses deterministic retry and health projections", () => {
      expect(getHubSpotRetryPolicy().scheduleSeconds).toEqual([5, 10, 20]);

      const health = projectHubSpotHealth({
        currentTime: BASE_TIME,
        quotaUsedPercent: 30,
        tokenExpiresAt: new Date(BASE_TIME.getTime() + 60 * 60000),
      });

      expect(health.status).toBe("healthy");
      expect(health.checkedAt).toEqual(BASE_TIME);
    });
  });
});
