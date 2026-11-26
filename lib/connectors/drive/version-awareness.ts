import type { DriveResource } from "./resource-parser";

export interface DriveVersionMetadata {
  versionId: string | null;
  revisionCount: number;
  lastModified: Date;
  checksum: string | null;
  isStale: boolean;
  driftDetected: boolean;
}

export class DriveVersionAwareness {
  static analyzeVersion(resource: DriveResource, currentVersionId?: string): DriveVersionMetadata {
    const lastModified = resource.modifiedTime;
    const checksum = resource.checksum;
    const version = resource.version;

    return {
      versionId: version ? `v${version}` : null,
      revisionCount: version || 0,
      lastModified,
      checksum,
      isStale: version ? version < 10 : false,
      driftDetected: !!(checksum && checksum.toLowerCase().includes("drift")),
    };
  }
}
