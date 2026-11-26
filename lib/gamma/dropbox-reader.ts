import { GammaReaderBase } from "../platform/gamma-reader-base";
import type { DropboxResource } from "../connectors/dropbox/resource-parser";

export class DropboxReader extends GammaReaderBase<DropboxResource> {
  getByName(name: string, _currentTime: Date): DropboxResource | undefined {
    return this.find((resource) => resource.name === name);
  }

  getByType(resourceType: DropboxResource["resourceType"]): DropboxResource[] {
    return this.filter((resource) => resource.resourceType === resourceType);
  }

  getRecent(currentTime: Date, limitDays = 7): DropboxResource[] {
    const cutoff = new Date(currentTime.getTime() - limitDays * 24 * 60 * 60 * 1000);
    return this.since((resource) => resource.modifiedAt, cutoff);
  }

  getSummary(currentTime: Date): {
    total: number;
    recent: number;
    files: number;
    folders: number;
    totalSizeBytes: number;
    lastUpdated: Date | null;
  } {
    const all = this.all();
    const latest = this.latest((resource) => resource.modifiedAt);
    return {
      total: all.length,
      recent: this.getRecent(currentTime).length,
      files: all.filter((resource) => resource.resourceType === "file").length,
      folders: all.filter((resource) => resource.resourceType === "folder").length,
      totalSizeBytes: all.reduce((sum, resource) => sum + (resource.sizeBytes ?? 0), 0),
      lastUpdated: latest ? new Date(latest.modifiedAt) : null,
    };
  }
}
