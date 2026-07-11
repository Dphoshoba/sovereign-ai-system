import { PLATFORM_BASE_TIME } from "../../../lib/platform/mock-time-helpers";
import type { DriveResource } from "../../../lib/connectors/drive/resource-parser";

const BASE_TIME = PLATFORM_BASE_TIME;

export const DriveFixtures = {
  validResource: (): DriveResource => ({
    id: "drive_file_001",
    name: "Mission Plan",
    mimeType: "application/vnd.google-apps.document",
    createdAt: BASE_TIME,
    owners: ["david@example.com"],
  }),
  folderResource: (): DriveResource => ({
    id: "drive_folder_001",
    name: "Launch Assets",
    mimeType: "application/vnd.google-apps.folder",
    createdAt: new Date(BASE_TIME.getTime() + 60 * 60000),
    owners: ["ops@example.com"],
  }),
  validToken: () => ({
    accessToken: "drive_access_token_valid_1234567890",
    expiresAt: new Date(BASE_TIME.getTime() + 3600000),
    scopes: ["https://www.googleapis.com/auth/drive.metadata.readonly"],
  }),
  expiredToken: () => ({
    accessToken: "drive_access_token_expired_1234567890",
    expiresAt: new Date(BASE_TIME.getTime() - 1000),
    scopes: [],
  }),
  readAction: () => ({
    actionId: "drive_read",
    params: { resource: "files" },
    requestedBy: "test-user",
    requestedAt: BASE_TIME,
  }),
  approvedAction: () => ({
    actionId: "drive_create",
    params: { name: "Approved Resource" },
    requestedBy: "user",
    requestedAt: BASE_TIME,
    approvedBy: "admin",
    approvedAt: BASE_TIME,
    approvalReason: "Standard approval",
    queueId: "drive_queue_001",
  }),
};
