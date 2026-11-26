import { GammaReaderBase } from "../platform/gamma-reader-base";
import type { DriveResource } from "../connectors/drive/resource-parser";

export class DriveReader extends GammaReaderBase<DriveResource> {
  getByName(name: string, _currentTime: Date): DriveResource | undefined {
    return this.find((resource) => resource.name === name);
  }

  getByMimeType(mimeType: string): DriveResource[] {
    return this.filter((resource) => resource.mimeType === mimeType);
  }

  getRecent(currentTime: Date, limitDays = 7): DriveResource[] {
    const cutoff = new Date(currentTime.getTime() - limitDays * 24 * 60 * 60 * 1000);
    return this.since((resource) => resource.createdAt, cutoff);
  }

  getSummary(currentTime: Date): {
    total: number;
    recent: number;
    folders: number;
    lastUpdated: Date | null;
  } {
    const all = this.all();
    const latest = this.latest((resource) => resource.createdAt);
    return {
      total: all.length,
      recent: this.getRecent(currentTime).length,
      folders: all.filter(
        (resource) => resource.mimeType === "application/vnd.google-apps.folder"
      ).length,
      lastUpdated: latest ? new Date(latest.createdAt) : null,
    };
  }
}
