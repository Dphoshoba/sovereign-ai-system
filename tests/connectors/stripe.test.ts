import { describe, expect, it, beforeEach } from "vitest";
import { StripeActions } from "../../lib/connectors/stripe/action-set";
import { StripeClient } from "../../lib/connectors/stripe/api-client";
import { StripeOAuth } from "../../lib/connectors/stripe/oauth-adapter";
import {
  getStripeProductionReadiness,
  getStripeRetryPolicy,
  projectStripeHealth,
} from "../../lib/connectors/stripe/production-readiness";
import { StripeParser } from "../../lib/connectors/stripe/resource-parser";
import { StripeReader } from "../../lib/gamma/stripe-reader";
import { StripeFixtures } from "../fixtures/stripe/stripe-fixtures";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

describe("Stripe Connector", () => {
  describe("OAuth Adapter", () => {
    it("defines Stripe Connect OAuth endpoints and scopes", () => {
      expect(StripeOAuth.authorizationUrl).toContain("stripe.com");
      expect(StripeOAuth.tokenUrl).toContain("stripe.com");
      expect(StripeOAuth.requiredScopes).toContain("read_only");
    });

    it("masks healthy tokens", () => {
      const result = StripeOAuth.validateToken({
        ...StripeFixtures.validToken(),
        expiresAt: new Date("2099-01-01T00:00:00.000Z"),
      });

      expect(result.valid).toBe(true);
      expect(result.maskedToken).toContain("****");
      expect(result.maskedToken).not.toContain("stripe_access_token_valid");
    });

    it("detects expired tokens", () => {
      const result = StripeOAuth.validateToken(StripeFixtures.expiredToken());

      expect(result.valid).toBe(false);
      expect(result.issue).toBe("expired");
    });
  });

  describe("API Client", () => {
    it("defines Stripe API metadata, quotas, and rate tiers", () => {
      expect(StripeClient.serviceName).toBe("Stripe");
      expect(StripeClient.baseUrl).toContain("api.stripe.com");
      expect(StripeClient.quotaDefinitions.length).toBeGreaterThan(0);
      expect(StripeClient.rateLimitTiers.length).toBeGreaterThan(0);
    });
  });

  describe("Resource Parser", () => {
    it("parses Stripe invoice metadata", () => {
      const parsed = StripeParser.parse({
        id: "in_123",
        description: "Mission Invoice",
        object: "invoice",
        amount: 5000,
        created_at: BASE_TIME.toISOString(),
      });

      expect(parsed.id).toBe("in_123");
      expect(parsed.name).toBe("Mission Invoice");
      expect(parsed.resourceType).toBe("invoice");
      expect(parsed.amountCents).toBe(5000);
    });

    it("validates complete resources and rejects incomplete resources", () => {
      expect(StripeParser.validate(StripeFixtures.customerResource()).valid).toBe(true);
      expect(
        StripeParser.validate({
          id: "",
          name: "",
          resourceType: "customer",
          createdAt: new Date("bad"),
        }).valid
      ).toBe(false);
    });

    it("redacts Stripe API keys from names", () => {
      const sanitized = StripeParser.sanitize({
        ...StripeFixtures.customerResource(),
        name: "key sk_live_1234567890abcdef",
      });

      expect(sanitized.name).toContain("sk_live_[redacted]");
      expect(sanitized.name).not.toContain("1234567890abcdef");
    });
  });

  describe("Action Set", () => {
    it("supports read and create invoice actions", () => {
      expect(StripeActions.supportedActions.map((action) => action.id)).toEqual([
        "stripe_read",
        "stripe_create_invoice",
      ]);
    });

    it("previews financial actions with approval warnings", async () => {
      const preview = await StripeActions.preview({
        actionId: "stripe_create_invoice",
        params: {},
        requestedBy: "operator",
        requestedAt: BASE_TIME,
      });

      expect(preview.requiresApproval).toBe(true);
      expect(preview.riskWarnings.join(" ")).toContain("financial");
    });

    it("queues approved financial actions when live execution is disabled", async () => {
      const receipt = await StripeActions.execute(StripeFixtures.approvedAction());

      expect(receipt.status).toBe("queued");
      expect(receipt.auditId).toContain("stripe-audit");
    });
  });

  describe("Stripe Reader", () => {
    let reader: StripeReader;

    beforeEach(() => {
      reader = new StripeReader();
    });

    it("stores, filters, and summarizes Stripe resources deterministically", () => {
      reader.set("customer", StripeFixtures.customerResource());
      reader.set("invoice", StripeFixtures.invoiceResource());

      expect(reader.getByType("invoice")).toHaveLength(1);
      expect(reader.getSummary(BASE_TIME).totalProjectedCents).toBe(120000);
      expect(reader.getSummary(BASE_TIME)).toEqual(reader.getSummary(BASE_TIME));
    });
  });

  describe("Production Readiness", () => {
    it("is certification-ready until score reaches production threshold", () => {
      const readiness = getStripeProductionReadiness();

      expect(readiness.connectorId).toBe("stripe");
      expect(readiness.priorityRank).toBe(9);
      expect(readiness.status).toBe("certification-ready");
      expect(readiness.missingCapabilities).toEqual([]);
    });

    it("uses deterministic retry and health projections", () => {
      expect(getStripeRetryPolicy().scheduleSeconds).toEqual([5, 10, 20]);

      const health = projectStripeHealth({
        currentTime: BASE_TIME,
        quotaUsedPercent: 30,
        tokenExpiresAt: new Date(BASE_TIME.getTime() + 60 * 60000),
      });

      expect(health.status).toBe("healthy");
      expect(health.checkedAt).toEqual(BASE_TIME);
    });
  });
});
