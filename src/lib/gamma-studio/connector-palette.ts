import type { StudioConnector } from "./types";

const BASE_CONNECTORS: StudioConnector[] = [
  { id: "gmail", name: "Gmail", category: "Communication", actions: ["read_message", "create_draft"], supportsPreview: true, mutatingActions: ["create_draft"] },
  { id: "calendar", name: "Calendar", category: "Scheduling", actions: ["list_events", "create_event"], supportsPreview: true, mutatingActions: ["create_event"] },
  { id: "slack", name: "Slack", category: "Communication", actions: ["send_message"], supportsPreview: true, mutatingActions: ["send_message"] },
  { id: "github", name: "GitHub", category: "Engineering", actions: ["list_repos", "create_issue"], supportsPreview: true, mutatingActions: ["create_issue"] },
  { id: "drive", name: "Drive", category: "Storage", actions: ["list_files", "create_file"], supportsPreview: true, mutatingActions: ["create_file"] },
  { id: "microsoft-365", name: "Microsoft 365", category: "Productivity", actions: ["list_mail", "send_mail"], supportsPreview: true, mutatingActions: ["send_mail"] },
  { id: "notion", name: "Notion", category: "Knowledge", actions: ["query_database", "create_page"], supportsPreview: true, mutatingActions: ["create_page"] },
  { id: "discord", name: "Discord", category: "Communication", actions: ["send_message"], supportsPreview: true, mutatingActions: ["send_message"] },
  { id: "stripe", name: "Stripe", category: "Finance", actions: ["stripe_read", "stripe_create_invoice"], supportsPreview: true, mutatingActions: ["stripe_create_invoice"] },
  { id: "salesforce", name: "Salesforce", category: "CRM", actions: ["salesforce_read", "salesforce_create_record"], supportsPreview: true, mutatingActions: ["salesforce_create_record"] },
  { id: "hubspot", name: "HubSpot", category: "CRM", actions: ["hubspot_read", "hubspot_create_record"], supportsPreview: true, mutatingActions: ["hubspot_create_record"] },
  { id: "dropbox", name: "Dropbox", category: "Storage", actions: ["dropbox_read", "dropbox_upload_file"], supportsPreview: true, mutatingActions: ["dropbox_upload_file"] },
  { id: "onedrive", name: "OneDrive", category: "Storage", actions: ["onedrive_read", "onedrive_upload_file"], supportsPreview: true, mutatingActions: ["onedrive_upload_file"] },
  { id: "sharepoint", name: "SharePoint", category: "Knowledge", actions: ["sharepoint_read", "sharepoint_create_list_item"], supportsPreview: true, mutatingActions: ["sharepoint_create_list_item"] },
];

export const CONTROL_NODE_IDS = ["trigger", "decision", "transform", "approval", "queue", "delay", "sink"] as const;

const CONTROL_NODES: StudioConnector[] = [
  { id: "trigger", name: "Trigger", category: "Control", nodeType: "trigger", actions: ["manual"], supportsPreview: true, mutatingActions: [] },
  { id: "approval", name: "Approval", category: "Governance", nodeType: "approval", actions: ["approve"], supportsPreview: true, mutatingActions: [] },
  { id: "queue", name: "Queue", category: "Governance", nodeType: "queue", actions: ["enqueue"], supportsPreview: true, mutatingActions: [] },
  { id: "decision", name: "Decision", category: "Logic", nodeType: "decision", actions: ["condition"], supportsPreview: true, mutatingActions: [] },
  { id: "sink", name: "Done", category: "Control", nodeType: "sink", actions: ["complete"], supportsPreview: true, mutatingActions: [] },
];

export function getConnectorPalette(): StudioConnector[] {
  return [...BASE_CONNECTORS, ...CONTROL_NODES];
}
