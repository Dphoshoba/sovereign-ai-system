import { GammaReaderBase } from "../platform/gamma-reader-base";
import type { HubSpotResource } from "../connectors/hubspot/resource-parser";

export class HubSpotReader extends GammaReaderBase<HubSpotResource> {
  getByName(name: string, _currentTime: Date): HubSpotResource | undefined {
    return this.find((resource) => resource.name === name);
  }

  getByType(resourceType: HubSpotResource["resourceType"]): HubSpotResource[] {
    return this.filter((resource) => resource.resourceType === resourceType);
  }

  getRecent(currentTime: Date, limitDays = 7): HubSpotResource[] {
    const cutoff = new Date(currentTime.getTime() - limitDays * 24 * 60 * 60 * 1000);
    return this.since((resource) => resource.createdAt, cutoff);
  }

  getSummary(currentTime: Date): {
    total: number;
    recent: number;
    contacts: number;
    deals: number;
    projectedDealValueCents: number;
    lastUpdated: Date | null;
  } {
    const all = this.all();
    const latest = this.latest((resource) => resource.createdAt);
    return {
      total: all.length,
      recent: this.getRecent(currentTime).length,
      contacts: all.filter((resource) => resource.resourceType === "contact").length,
      deals: all.filter((resource) => resource.resourceType === "deal").length,
      projectedDealValueCents: all.reduce(
        (sum, resource) => sum + (resource.amountCents ?? 0),
        0
      ),
      lastUpdated: latest ? new Date(latest.createdAt) : null,
    };
  }
}
