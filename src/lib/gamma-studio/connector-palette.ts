import type { StudioConnector } from "./types";

const BASE_CONNECTORS: StudioConnector[] = [
  { id: "gmail", name: "Gmail", category: "Communication", actions: ["read_message", "create_draft"], supportsPreview: true, mutatingActions: ["create_draft"] },
  { id: "calendar", name: "Calendar", category: "Scheduling", actions: ["list_events", "create_event"], supportsPreview: true, mutatingActions: ["create_event"] },
  { id: "slack", name: "Slack", category: "Communication", actions: ["send_message"], supportsPreview: true, mutatingActions: ["send_message"] },
  { id: "github", name: "GitHub", category: "Engineering", actions: ["list_repos", "create_issue"], supportsPreview: true, mutatingActions: ["create_issue"] },
  { id: "drive", name: "Drive", category: "Storage", actions: ["list_files", "create_file"], supportsPreview: true, mutatingActions: ["create_file"] },
  { id: "office365", name: "Office365", category: "Productivity", actions: ["list_mail", "send_mail"], supportsPreview: true, mutatingActions: ["send_mail"] },
  { id: "notion", name: "Notion", category: "Knowledge", actions: ["query_database", "create_page"], supportsPreview: true, mutatingActions: ["create_page"] },
  { id: "discord", name: "Discord", category: "Communication", actions: ["send_message"], supportsPreview: true, mutatingActions: ["send_message"] },
];

export const CONTROL_NODE_IDS = ["trigger", "decision", "transform", "approval", "queue", "delay", "sink"] as const;

export function getConnectorPalette(): StudioConnector[] {
  return [...BASE_CONNECTORS];
}
