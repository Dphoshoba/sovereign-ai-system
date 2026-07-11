import { GammaReaderBase } from "../platform/gamma-reader-base";
import type { SalesforceResource } from "../connectors/salesforce/resource-parser";

export class SalesforceReader extends GammaReaderBase<SalesforceResource> {
  getByName(name: string, _currentTime: Date): SalesforceResource | undefined {
    return this.find((resource) => resource.name === name);
  }

  getByType(resourceType: SalesforceResource["resourceType"]): SalesforceResource[] {
    return this.filter((resource) => resource.resourceType === resourceType);
  }

  getRecent(currentTime: Date, limitDays = 7): SalesforceResource[] {
    const cutoff = new Date(currentTime.getTime() - limitDays * 24 * 60 * 60 * 1000);
    return this.since((resource) => resource.createdAt, cutoff);
  }

  getSummary(currentTime: Date): {
    total: number;
    recent: number;
    accounts: number;
    opportunities: number;
    projectedPipelineCents: number;
    lastUpdated: Date | null;
  } {
    const all = this.all();
    const latest = this.latest((resource) => resource.createdAt);
    return {
      total: all.length,
      recent: this.getRecent(currentTime).length,
      accounts: all.filter((resource) => resource.resourceType === "account").length,
      opportunities: all.filter((resource) => resource.resourceType === "opportunity")
        .length,
      projectedPipelineCents: all.reduce(
        (sum, resource) => sum + (resource.amountCents ?? 0),
        0
      ),
      lastUpdated: latest ? new Date(latest.createdAt) : null,
    };
  }
}
