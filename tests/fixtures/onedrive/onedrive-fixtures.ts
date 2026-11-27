import type { ApprovedAction, TokenSet } from "../../../lib/platform/connector-platform-sdk";
import type { OneDriveResource } from "../../../lib/connectors/onedrive/resource-parser";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

export const OneDriveFixtures = {
  validToken(): TokenSet {
    return {
      accessToken: "onedrive_access_token_valid",
      refreshToken: "onedrive_refresh_token_valid",
      expiresAt: new Date(BASE_TIME.getTime() + 60 * 60000),
      scopes: ["Files.Read", "Files.Read.All"],
    };
  },
  expiredToken(): TokenSet {
    return {
      ...this.validToken(),
      expiresAt: new Date(BASE_TIME.getTime() - 60000),
    };
  },
  fileResource(): OneDriveResource {
    return {
      id: "onedrive-file-001",
      name: "Gamma Brief.pdf",
      resourceType: "file",
      webUrl: "https://contoso-my.sharepoint.com/personal/gamma/brief.pdf",
      sizeBytes: 4096,
      modifiedAt: BASE_TIME,
    };
  },
  folderResource(): OneDriveResource {
    return {
      id: "onedrive-folder-001",
      name: "Gamma Folder",
      resourceType: "folder",
      modifiedAt: BASE_TIME,
    };
  },
  approvedAction(): ApprovedAction {
    return {
      actionId: "onedrive_upload_file",
      params: { path: "/Gamma/Brief.pdf" },
      requestedBy: "operator",
      requestedAt: BASE_TIME,
      approvedBy: "approver",
      approvedAt: BASE_TIME,
      approvalReason: "File upload approved for governed queue test.",
      queueId: "queue-onedrive-001",
    };
  },
};
