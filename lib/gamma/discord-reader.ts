import { GammaReaderBase } from "../platform/gamma-reader-base";
import type { DiscordResource } from "../connectors/discord/resource-parser";

export class DiscordReader extends GammaReaderBase<DiscordResource> {
  getByName(name: string, _currentTime: Date): DiscordResource | undefined {
    return this.find((resource) => resource.name === name);
  }

  getByType(resourceType: DiscordResource["resourceType"]): DiscordResource[] {
    return this.filter((resource) => resource.resourceType === resourceType);
  }

  getRecent(currentTime: Date, limitDays = 7): DiscordResource[] {
    const cutoff = new Date(currentTime.getTime() - limitDays * 24 * 60 * 60 * 1000);
    return this.since((resource) => resource.createdAt, cutoff);
  }

  getSummary(currentTime: Date): {
    total: number;
    recent: number;
    guilds: number;
    channels: number;
    messages: number;
    lastUpdated: Date | null;
  } {
    const all = this.all();
    const latest = this.latest((resource) => resource.createdAt);
    return {
      total: all.length,
      recent: this.getRecent(currentTime).length,
      guilds: all.filter((resource) => resource.resourceType === "guild").length,
      channels: all.filter((resource) => resource.resourceType === "channel").length,
      messages: all.filter((resource) => resource.resourceType === "message").length,
      lastUpdated: latest ? new Date(latest.createdAt) : null,
    };
  }
}
