import { WORKFLOW_TEMPLATES } from "../gamma-flow/workflow-templates";
import type { StudioMarketplaceTemplate, StudioNode, StudioWorkflow } from "./types";

export const STUDIO_FIXED_TIME = "2026-07-10T12:00:00.000Z";

export const MOCK_CONNECTOR_OAUTH: Record<string, "connected" | "missing"> = {
  gmail: "connected",
  calendar: "connected",
  slack: "connected",
  github: "connected",
  drive: "missing",
  office365: "connected",
  notion: "connected",
  discord: "connected",
};

export const MOCK_STUDIO_WORKFLOW: StudioWorkflow = {
  id: "studio_workflow_001",
  name: "Gamma Studio Preview Workflow",
  previewOnly: true,
  nodes: [
    {
      id: "trigger_001",
      type: "trigger",
      name: "Start",
      position: { x: 80, y: 80 },
      config: {},
      oauthStatus: "connected",
      health: "healthy",
      rateLimit: "ok",
      permissions: ["read"],
      outputPreview: "Triggered in preview mode",
    },
    {
      id: "node_001",
      type: "connector",
      name: "Gmail",
      connectorName: "gmail",
      actionId: "read_message",
      position: { x: 280, y: 80 },
      config: { mailbox: "INBOX" },
      oauthStatus: "connected",
      health: "healthy",
      rateLimit: "ok",
      permissions: ["read"],
      outputPreview: "5 emails previewed",
    },
    {
      id: "node_002",
      type: "approval",
      name: "Approval",
      position: { x: 480, y: 80 },
      config: { approver: "executive@example.com" },
      oauthStatus: "connected",
      health: "healthy",
      rateLimit: "ok",
      permissions: ["approve"],
      outputPreview: "Awaiting approval",
    },
    {
      id: "node_003",
      type: "queue",
      name: "Queue",
      position: { x: 680, y: 80 },
      config: { priority: "normal" },
      oauthStatus: "connected",
      health: "healthy",
      rateLimit: "ok",
      permissions: ["enqueue"],
      outputPreview: "Queued for preview",
    },
    {
      id: "node_004",
      type: "connector",
      name: "Slack",
      connectorName: "slack",
      actionId: "send_message",
      position: { x: 880, y: 80 },
      config: { channel: "#alerts" },
      oauthStatus: "connected",
      health: "healthy",
      rateLimit: "ok",
      permissions: ["write"],
      outputPreview: "Slack preview prepared",
    },
    {
      id: "sink_001",
      type: "sink",
      name: "Done",
      position: { x: 1080, y: 80 },
      config: {},
      oauthStatus: "connected",
      health: "healthy",
      rateLimit: "ok",
      permissions: ["read"],
      outputPreview: "Preview complete",
    },
  ],
  edges: [
    { id: "edge_001", from: "trigger_001", to: "node_001", type: "always" },
    { id: "edge_002", from: "node_001", to: "node_002", type: "success" },
    { id: "edge_003", from: "node_002", to: "node_003", type: "approved" },
    { id: "edge_004", from: "node_003", to: "node_004", type: "always" },
    { id: "edge_005", from: "node_004", to: "sink_001", type: "success" },
  ],
};

export const MOCK_MARKETPLACE_TEMPLATES: StudioMarketplaceTemplate[] = [
  {
    id: "market_gmail_triage",
    title: "Gmail Triage",
    description: "Classify inbound Gmail and draft safe responses.",
    sourceTemplate: WORKFLOW_TEMPLATES[0],
  },
  {
    id: "market_gmail_slack_priority",
    title: "Gmail to Slack Priority",
    description: "Route priority Gmail to Slack with approval and queue.",
    sourceTemplate: WORKFLOW_TEMPLATES[1],
  },
  {
    id: "market_weekly_executive_brief",
    title: "Weekly Executive Brief",
    description: "Generate weekly briefing with approval and queue.",
    sourceTemplate: WORKFLOW_TEMPLATES[2],
  },
];

export const MOCK_COLLABORATORS = [
  { id: "u_001", name: "David", role: "Owner" },
  { id: "u_002", name: "Analyst", role: "Editor" },
  { id: "u_003", name: "Approver", role: "Reviewer" },
];

export const MOCK_COMMENTS = [
  {
    id: "comment_001",
    author: "Analyst",
    message: "Add queue before mutating actions for safety.",
    nodeId: "node_004",
    createdAt: "2026-07-10T12:05:00.000Z",
  },
  {
    id: "comment_002",
    author: "Approver",
    message: "Approval step looks good.",
    nodeId: "node_002",
    createdAt: "2026-07-10T12:06:00.000Z",
  },
];

export const MOCK_VERSIONS = [
  { id: "v_001", label: "v0.1", createdBy: "David", createdAt: "2026-07-10T12:00:00.000Z" },
  { id: "v_002", label: "v0.2", createdBy: "Analyst", createdAt: "2026-07-10T12:10:00.000Z" },
];

export function createDeterministicNode(id: string, name: string, type: StudioNode["type"], x: number, y: number): StudioNode {
  return {
    id,
    name,
    type,
    position: { x, y },
    config: {},
    oauthStatus: "connected",
    health: "healthy",
    rateLimit: "ok",
    permissions: ["read"],
    outputPreview: `${name} preview output`,
  };
}
