import { PLATFORM_BASE_TIME } from "../../../lib/platform/mock-time-helpers";
import type { Microsoft365Resource } from "../../../lib/connectors/microsoft-365/resource-parser";

const BASE_TIME = PLATFORM_BASE_TIME;

export const Microsoft365Fixtures = {
  mailResource: (): Microsoft365Resource => ({
    id: "ms_mail_001",
    name: "Launch update",
    resourceType: "mail",
    webUrl: "https://outlook.office.com/mail/item/ms_mail_001",
    createdAt: BASE_TIME,
  }),
  fileResource: (): Microsoft365Resource => ({
    id: "ms_file_001",
    name: "Launch Deck",
    resourceType: "file",
    webUrl: "https://microsoft365.com/file/ms_file_001",
    createdAt: new Date(BASE_TIME.getTime() + 60 * 60000),
  }),
  validToken: () => ({
    accessToken: "microsoft365_access_token_valid_1234567890",
    expiresAt: new Date(BASE_TIME.getTime() + 3600000),
    scopes: ["User.Read", "Mail.Read", "Files.Read.All"],
  }),
  expiredToken: () => ({
    accessToken: "microsoft365_access_token_expired_1234567890",
    expiresAt: new Date(BASE_TIME.getTime() - 1000),
    scopes: [],
  }),
  approvedAction: () => ({
    actionId: "microsoft365_create",
    params: { name: "Approved resource" },
    requestedBy: "user",
    requestedAt: BASE_TIME,
    approvedBy: "admin",
    approvedAt: BASE_TIME,
    approvalReason: "Standard approval",
    queueId: "microsoft365_queue_001",
  }),
};
