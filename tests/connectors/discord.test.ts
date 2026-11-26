import { describe, expect, it, beforeEach } from "vitest";
import { DiscordActions } from "../../lib/connectors/discord/action-set";
import { DiscordClient } from "../../lib/connectors/discord/api-client";
import { DiscordOAuth } from "../../lib/connectors/discord/oauth-adapter";
import {
  getDiscordProductionReadiness,
  getDiscordRetryPolicy,
  projectDiscordHealth,
} from "../../lib/connectors/discord/production-readiness";
import { DiscordParser } from "../../lib/connectors/discord/resource-parser";
import { DiscordReader } from "../../lib/gamma/discord-reader";
import { DiscordFixtures } from "../fixtures/discord/discord-fixtures";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

describe("Discord Connector", () => {
  describe("OAuth Adapter", () => {
    it("defines Discord OAuth endpoints and scopes", () => {
      expect(DiscordOAuth.authorizationUrl).toContain("discord.com");
      expect(DiscordOAuth.tokenUrl).toContain("discord.com");
      expect(DiscordOAuth.requiredScopes).toContain("identify");
    });

    it("masks healthy tokens", () => {
      const result = DiscordOAuth.validateToken({
        ...DiscordFixtures.validToken(),
        expiresAt: new Date("2099-01-01T00:00:00.000Z"),
      });

      expect(result.valid).toBe(true);
      expect(result.maskedToken).toContain("****");
      expect(result.maskedToken).not.toContain("discord_access_token_valid");
    });

    it("detects expired tokens", () => {
      const result = DiscordOAuth.validateToken(DiscordFixtures.expiredToken());

      expect(result.valid).toBe(false);
      expect(result.issue).toBe("expired");
    });
  });

  describe("API Client", () => {
    it("defines Discord API metadata, quotas, and rate tiers", () => {
      expect(DiscordClient.serviceName).toBe("Discord");
      expect(DiscordClient.baseUrl).toContain("discord.com");
      expect(DiscordClient.quotaDefinitions.length).toBeGreaterThan(0);
      expect(DiscordClient.rateLimitTiers.length).toBeGreaterThan(0);
    });
  });

  describe("Resource Parser", () => {
    it("parses Discord channel metadata", () => {
      const parsed = DiscordParser.parse({
        id: "channel-1",
        name: "launch-room",
        type: "channel",
        created_at: BASE_TIME.toISOString(),
      });

      expect(parsed.id).toBe("channel-1");
      expect(parsed.name).toBe("launch-room");
      expect(parsed.resourceType).toBe("channel");
    });

    it("validates complete resources and rejects incomplete resources", () => {
      expect(DiscordParser.validate(DiscordFixtures.guildResource()).valid).toBe(true);
      expect(
        DiscordParser.validate({
          id: "",
          name: "",
          resourceType: "guild",
          createdAt: new Date("bad"),
        }).valid
      ).toBe(false);
    });

    it("redacts token-like content from resource names", () => {
      const sanitized = DiscordParser.sanitize({
        ...DiscordFixtures.channelResource(),
        name: "token=secret",
      });

      expect(sanitized.name).toContain("token=[redacted]");
      expect(sanitized.name).not.toContain("secret");
    });
  });

  describe("Action Set", () => {
    it("supports read and create message actions", () => {
      expect(DiscordActions.supportedActions.map((action) => action.id)).toEqual([
        "discord_read",
        "discord_create_message",
      ]);
    });

    it("previews write actions with approval warnings", async () => {
      const preview = await DiscordActions.preview({
        actionId: "discord_create_message",
        params: {},
        requestedBy: "operator",
        requestedAt: BASE_TIME,
      });

      expect(preview.requiresApproval).toBe(true);
      expect(preview.riskWarnings.join(" ")).toContain("approval");
    });

    it("queues approved actions when live execution is disabled", async () => {
      const receipt = await DiscordActions.execute(DiscordFixtures.approvedAction());

      expect(receipt.status).toBe("queued");
      expect(receipt.auditId).toContain("discord-audit");
    });
  });

  describe("Discord Reader", () => {
    let reader: DiscordReader;

    beforeEach(() => {
      reader = new DiscordReader();
    });

    it("stores, filters, and summarizes Discord resources deterministically", () => {
      reader.set("guild", DiscordFixtures.guildResource());
      reader.set("channel", DiscordFixtures.channelResource());

      expect(reader.getByType("channel")).toHaveLength(1);
      expect(reader.getSummary(BASE_TIME).total).toBe(2);
      expect(reader.getSummary(BASE_TIME)).toEqual(reader.getSummary(BASE_TIME));
    });
  });

  describe("Production Readiness", () => {
    it("is certification-ready until score reaches production threshold", () => {
      const readiness = getDiscordProductionReadiness();

      expect(readiness.connectorId).toBe("discord");
      expect(readiness.priorityRank).toBe(8);
      expect(readiness.status).toBe("certification-ready");
      expect(readiness.missingCapabilities).toEqual([]);
    });

    it("uses deterministic retry and health projections", () => {
      expect(getDiscordRetryPolicy().scheduleSeconds).toEqual([5, 10, 20]);

      const health = projectDiscordHealth({
        currentTime: BASE_TIME,
        quotaUsedPercent: 30,
        tokenExpiresAt: new Date(BASE_TIME.getTime() + 60 * 60000),
      });

      expect(health.status).toBe("healthy");
      expect(health.checkedAt).toEqual(BASE_TIME);
    });
  });
});
