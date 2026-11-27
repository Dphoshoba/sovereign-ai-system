import { GammaReaderBase } from "../platform/gamma-reader-base";
import type { SharePointResource } from "../connectors/sharepoint/resource-parser";

export class SharePointReader extends GammaReaderBase<SharePointResource> {
  getByName(name: string, _currentTime: Date): SharePointResource | undefined {
    return this.find((resource) => resource.name === name);
  }

  getByType(resourceType: SharePointResource["resourceType"]): SharePointResource[] {
    return this.filter((resource) => resource.resourceType === resourceType);
  }

  getRecent(currentTime: Date, limitDays = 7): SharePointResource[] {
    const cutoff = new Date(currentTime.getTime() - limitDays * 24 * 60 * 60 * 1000);
    return this.since((resource) => resource.modifiedAt, cutoff);
  }

  getSummary(currentTime: Date): {
    total: number;
    recent: number;
    sites: number;
    lists: number;
    totalItemCount: number;
    lastUpdated: Date | null;
  } {
    const all = this.all();
    const latest = this.latest((resource) => resource.modifiedAt);
    return {
      total: all.length,
      recent: this.getRecent(currentTime).length,
      sites: all.filter((resource) => resource.resourceType === "site").length,
      lists: all.filter((resource) => resource.resourceType === "list").length,
      totalItemCount: all.reduce((sum, resource) => sum + (resource.itemCount ?? 0), 0),
      lastUpdated: latest ? new Date(latest.modifiedAt) : null,
    };
  }
}
