import { PLATFORM_BASE_TIME } from "../../../lib/platform/mock-time-helpers";
import type { DiscordResource } from "../../../lib/connectors/discord/resource-parser";

const BASE_TIME = PLATFORM_BASE_TIME;

export const DiscordFixtures = {
  guildResource: (): DiscordResource => ({
    id: "discord_guild_001",
    name: "Gamma Operators",
    resourceType: "guild",
    createdAt: BASE_TIME,
  }),
  channelResource: (): DiscordResource => ({
    id: "discord_channel_001",
    name: "launch-room",
    resourceType: "channel",
    createdAt: new Date(BASE_TIME.getTime() + 60 * 60000),
  }),
  validToken: () => ({
    accessToken: "discord_access_token_valid_1234567890",
    expiresAt: new Date(BASE_TIME.getTime() + 3600000),
    scopes: ["identify", "guilds"],
  }),
  expiredToken: () => ({
    accessToken: "discord_access_token_expired_1234567890",
    expiresAt: new Date(BASE_TIME.getTime() - 1000),
    scopes: [],
  }),
  approvedAction: () => ({
    actionId: "discord_create_message",
    params: { content: "Approved message" },
    requestedBy: "user",
    requestedAt: BASE_TIME,
    approvedBy: "admin",
    approvedAt: BASE_TIME,
    approvalReason: "Standard approval",
    queueId: "discord_queue_001",
  }),
};
