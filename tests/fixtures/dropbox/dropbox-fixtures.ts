import type { ApprovedAction, TokenSet } from "../../../lib/platform/connector-platform-sdk";
import type { DropboxResource } from "../../../lib/connectors/dropbox/resource-parser";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

export const DropboxFixtures = {
  validToken(): TokenSet {
    return {
      accessToken: "dropbox_access_token_valid",
      refreshToken: "dropbox_refresh_token_valid",
      expiresAt: new Date(BASE_TIME.getTime() + 60 * 60000),
      scopes: ["files.metadata.read", "files.content.read"],
    };
  },
  expiredToken(): TokenSet {
    return {
      ...this.validToken(),
      expiresAt: new Date(BASE_TIME.getTime() - 60000),
    };
  },
  fileResource(): DropboxResource {
    return {
      id: "id:dropbox-file-001",
      name: "Gamma Brief.pdf",
      resourceType: "file",
      pathLower: "/gamma/brief.pdf",
      sizeBytes: 2048,
      modifiedAt: BASE_TIME,
    };
  },
  folderResource(): DropboxResource {
    return {
      id: "id:dropbox-folder-001",
      name: "Gamma Folder",
      resourceType: "folder",
      pathLower: "/gamma",
      modifiedAt: BASE_TIME,
    };
  },
  approvedAction(): ApprovedAction {
    return {
      actionId: "dropbox_upload_file",
      params: { path: "/gamma/brief.pdf" },
      requestedBy: "operator",
      requestedAt: BASE_TIME,
      approvedBy: "approver",
      approvedAt: BASE_TIME,
      approvalReason: "File upload approved for governed queue test.",
      queueId: "queue-dropbox-001",
    };
  },
};
