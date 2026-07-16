import { DriveMetadataReader } from "./metadata-reader";
import type { DriveResource } from "./resource-parser";
import type { ResourceSecurityClassification } from "../../platform/security/resource-security-types";

export interface FolderBrowserItem {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  isShortcut: boolean;
  parentIds: string[];
  driveId: string | null;
  ownerSummary: string;
  permissionSummary: string;
  classification: ResourceSecurityClassification;
  modifiedTime: Date;
  version: number | null;
  trashed: boolean;
  childrenAvailable: boolean;
  safeNavigationMetadata: {
    depth: number;
    maxDepthReached: boolean;
    pagination: {
      nextPageToken: string | null;
      hasMore: boolean;
    };
  };
}

export interface FolderBrowserOptions {
  folderId?: string;
  maxDepth?: number;
  maxItems?: number;
  pageToken?: string;
  includeTrashed?: boolean;
}

export class DriveFolderBrowser {
  private static FOLDER_MIME = "application/vnd.google-apps.folder";
  private static SHORTCUT_MIME = "application/vnd.google-apps.shortcut";

  /**
   * Lists contents of a folder or root in a deterministic, metadata-only fashion.
   */
  static async listFolder(
    options: FolderBrowserOptions = {}
  ): Promise<{ items: FolderBrowserItem[]; nextPageToken: string | null }> {
    const {
      folderId = "root",
      maxDepth = 1,
      maxItems = 100,
      pageToken = null,
      includeTrashed = false,
    } = options;

    // Simulation: Mock items.
    const mockRawItems = this.getMockItemsForFolder(folderId);
    
    const filteredItems = mockRawItems
      .filter(item => includeTrashed || !item.trashed)
      .slice(0, maxItems);

    const browserItems: FolderBrowserItem[] = [...filteredItems]
      .sort((a, b) => String(a.id).localeCompare(String(b.id)))
      .map((raw) => {
      const { resource, security } = DriveMetadataReader.readMetadata(raw);
      
      return {
        id: resource.id,
        name: resource.name,
        mimeType: resource.mimeType,
        isFolder: resource.mimeType === this.FOLDER_MIME,
        isShortcut: resource.mimeType === this.SHORTCUT_MIME,
        parentIds: resource.parents,
        driveId: resource.sharedDrive ? "shared-drive-id" : null,
        ownerSummary: resource.owners[0] || "unknown",
        permissionSummary: resource.effectivePermissions,
        classification: security,
        modifiedTime: resource.modifiedTime,
        version: resource.version,
        trashed: !!raw.trashed,
        childrenAvailable: resource.mimeType === this.FOLDER_MIME,
        safeNavigationMetadata: {
          depth: 0,
          maxDepthReached: false,
          pagination: {
            nextPageToken: null,
            hasMore: false,
          },
        },
      };
    });

    return {
      items: browserItems,
      nextPageToken: null,
    };
  }

  /**
   * Construct a deterministic breadcrumb path from metadata.
   */
  static constructBreadcrumbs(resource: DriveResource, hierarchy: DriveResource[]): string[] {
    const path: string[] = [];
    let current = resource;
    
    const resourcePath = hierarchy.filter(r => 
      resource.parents.includes(r.id) || 
      (path.length > 0 && current.parents.includes(r.id))
    );

    return [...resourcePath.map(r => r.name), resource.name].reverse();
  }

  private static getMockItemsForFolder(folderId: string): any[] {
    if (folderId === "root") {
      return [
        { id: "f1", name: "Documents", mimeType: this.FOLDER_MIME, parents: ["root"], owners: ["me@ex.com"], permissions: [{type: "user", email: "me@ex.com"}] },
        { id: "file1", name: "Resume.pdf", mimeType: "application/pdf", parents: ["root"], owners: ["me@ex.com"], permissions: [{type: "user", email: "me@ex.com"}] },
      ];
    }
    if (folderId === "f1") {
      return [
        { id: "file2", name: "Plan.docx", mimeType: "application/vnd.google-apps.document", parents: ["f1"], owners: ["me@ex.com"], permissions: [{type: "user", email: "me@ex.com"}] },
      ];
    }
    return [];
  }
}
