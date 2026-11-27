import { GammaReaderBase } from "../platform/gamma-reader-base";
import type { Microsoft365Resource } from "../connectors/microsoft-365/resource-parser";

export class Microsoft365Reader extends GammaReaderBase<Microsoft365Resource> {
  getByName(name: string, _currentTime: Date): Microsoft365Resource | undefined {
    return this.find((resource) => resource.name === name);
  }

  getByType(resourceType: Microsoft365Resource["resourceType"]): Microsoft365Resource[] {
    return this.filter((resource) => resource.resourceType === resourceType);
  }

  getRecent(currentTime: Date, limitDays = 7): Microsoft365Resource[] {
    const cutoff = new Date(currentTime.getTime() - limitDays * 24 * 60 * 60 * 1000);
    return this.since((resource) => resource.createdAt, cutoff);
  }

  getSummary(currentTime: Date): {
    total: number;
    recent: number;
    mail: number;
    files: number;
    sites: number;
    teams: number;
    lastUpdated: Date | null;
  } {
    const all = this.all();
    const latest = this.latest((resource) => resource.createdAt);
    return {
      total: all.length,
      recent: this.getRecent(currentTime).length,
      mail: all.filter((resource) => resource.resourceType === "mail").length,
      files: all.filter((resource) => resource.resourceType === "file").length,
      sites: all.filter((resource) => resource.resourceType === "site").length,
      teams: all.filter((resource) => resource.resourceType === "team").length,
      lastUpdated: latest ? new Date(latest.createdAt) : null,
    };
  }
}
