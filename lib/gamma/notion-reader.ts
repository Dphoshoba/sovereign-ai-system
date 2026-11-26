import { GammaReaderBase } from "../platform/gamma-reader-base";
import type { NotionResource } from "../connectors/notion/resource-parser";

export class NotionReader extends GammaReaderBase<NotionResource> {
  getByTitle(title: string, _currentTime: Date): NotionResource | undefined {
    return this.find((resource) => resource.title === title);
  }

  getByType(resourceType: NotionResource["resourceType"]): NotionResource[] {
    return this.filter((resource) => resource.resourceType === resourceType);
  }

  getRecent(currentTime: Date, limitDays = 7): NotionResource[] {
    const cutoff = new Date(currentTime.getTime() - limitDays * 24 * 60 * 60 * 1000);
    return this.since((resource) => resource.createdAt, cutoff);
  }

  getSummary(currentTime: Date): {
    total: number;
    recent: number;
    pages: number;
    databases: number;
    lastUpdated: Date | null;
  } {
    const all = this.all();
    const latest = this.latest((resource) => resource.createdAt);
    return {
      total: all.length,
      recent: this.getRecent(currentTime).length,
      pages: all.filter((resource) => resource.resourceType === "page").length,
      databases: all.filter((resource) => resource.resourceType === "database").length,
      lastUpdated: latest ? new Date(latest.createdAt) : null,
    };
  }
}
