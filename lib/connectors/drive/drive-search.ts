import { DriveMetadataReader } from "./metadata-reader";
import type { DriveResource } from "./resource-parser";
import type { ResourceSecurityClassification } from "../../platform/security/resource-security-types";

export interface DriveSearchQuery {
  text?: string;
  mimeType?: string;
  owner?: string;
  modifiedAfter?: Date;
  includeTrashed?: boolean;
  maxResults?: number;
}

export interface DriveSearchResult {
  resource: DriveResource;
  security: ResourceSecurityClassification;
}

export class DriveSearch {
  /**
   * Performs a deterministic search for Drive resources using metadata only.
   */
  static async search(query: DriveSearchQuery = {}): Promise<{ results: DriveSearchResult[]; nextPageToken: string | null }> {
    const {
      text,
      mimeType,
      owner,
      modifiedAfter,
      includeTrashed = false,
      maxResults = 100,
    } = query;

    const mockResults = this.getMockSearchResults(query);
    
    const results: DriveSearchResult[] = mockResults
      .filter(item => includeTrashed || !item.trashed)
      .slice(0, maxResults)
      .map(raw => {
        const { resource, security } = DriveMetadataReader.readMetadata(raw);
        return { resource, security };
      });

    results.sort((a, b) => a.resource.id.localeCompare(b.resource.id));

    return {
      results,
      nextPageToken: null,
    };
  }

  private static getMockSearchResults(query: DriveSearchQuery): any[] {
    const items = [
      { id: "f1", name: "Documents", mimeType: "application/vnd.google-apps.folder", parents: ["root"], owners: ["me@ex.com"], permissions: [{type: "user", email: "me@ex.com"}] },
      { id: "file1", name: "Resume.pdf", mimeType: "application/pdf", parents: ["root"], owners: ["me@ex.com"], permissions: [{type: "user", email: "me@ex.com"}] },
      { id: "file2", name: "Budget.xlsx", mimeType: "application/vnd.google-apps.spreadsheet", parents: ["f1"], owners: ["me@ex.com"], permissions: [{type: "user", email: "me@ex.com"}] },
      { id: "file3", name: "Secret.docx", mimeType: "application/vnd.google-apps.document", parents: ["f1"], owners: ["me@ex.com"], permissions: [{type: "user", email: "me@ex.com"}] },
    ];

    return items.filter(item => {
      if (query.text && !item.name.toLowerCase().includes(query.text.toLowerCase())) return false;
      if (query.mimeType && item.mimeType !== query.mimeType) return false;
      if (query.owner && !item.owners.includes(query.owner)) return false;
      return true;
    });
  }
}
