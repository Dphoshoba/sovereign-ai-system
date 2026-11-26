import { GammaReaderBase } from "../platform/gamma-reader-base";
import type { StripeResource } from "../connectors/stripe/resource-parser";

export class StripeReader extends GammaReaderBase<StripeResource> {
  getByName(name: string, _currentTime: Date): StripeResource | undefined {
    return this.find((resource) => resource.name === name);
  }

  getByType(resourceType: StripeResource["resourceType"]): StripeResource[] {
    return this.filter((resource) => resource.resourceType === resourceType);
  }

  getRecent(currentTime: Date, limitDays = 7): StripeResource[] {
    const cutoff = new Date(currentTime.getTime() - limitDays * 24 * 60 * 60 * 1000);
    return this.since((resource) => resource.createdAt, cutoff);
  }

  getSummary(currentTime: Date): {
    total: number;
    recent: number;
    invoices: number;
    subscriptions: number;
    totalProjectedCents: number;
    lastUpdated: Date | null;
  } {
    const all = this.all();
    const latest = this.latest((resource) => resource.createdAt);
    return {
      total: all.length,
      recent: this.getRecent(currentTime).length,
      invoices: all.filter((resource) => resource.resourceType === "invoice").length,
      subscriptions: all.filter((resource) => resource.resourceType === "subscription").length,
      totalProjectedCents: all.reduce(
        (sum, resource) => sum + (resource.amountCents ?? 0),
        0
      ),
      lastUpdated: latest ? new Date(latest.createdAt) : null,
    };
  }
}
