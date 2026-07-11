import type { EdgeType, NodeType, WorkflowDefinition, WorkflowTemplate } from "../gamma-flow/types";

export type StudioNodeKind = NodeType;

export interface StudioNode {
  id: string;
  type: StudioNodeKind;
  name: string;
  connectorName?: string;
  actionId?: string;
  position: { x: number; y: number };
  config: Record<string, string | number | boolean>;
  oauthStatus?: "connected" | "missing";
  health?: "healthy" | "degraded" | "down";
  rateLimit?: "ok" | "near" | "limited";
  permissions?: string[];
  outputPreview?: string;
}

export interface StudioEdge {
  id: string;
  from: string;
  to: string;
  type: EdgeType;
}

export interface StudioWorkflow {
  id: string;
  name: string;
  nodes: StudioNode[];
  edges: StudioEdge[];
  previewOnly: true;
}

export interface StudioConnector {
  id: string;
  name: string;
  category: string;
  actions: string[];
  supportsPreview: boolean;
  mutatingActions: string[];
}

export interface StudioValidationIssue {
  code: string;
  severity: "error" | "warning";
  message: string;
  location?: string;
}

export interface StudioValidationResult {
  valid: boolean;
  saveReady: boolean;
  validationScore: number;
  safetyScore: number;
  issues: StudioValidationIssue[];
}

export interface StudioSimulationEvent {
  id: string;
  time: string;
  type:
    | "validation"
    | "simulation_start"
    | "connector_preview"
    | "decision"
    | "approval_wait"
    | "queue"
    | "running"
    | "cancelled_preview"
    | "completed_preview"
    | "failed_preview";
  nodeId?: string;
  message: string;
}

export interface StudioSimulationResult {
  status: "completed_preview" | "failed_preview" | "waiting_approval" | "running" | "cancelled_preview";
  events: StudioSimulationEvent[];
  output: Record<string, unknown>;
}

export interface StudioMarketplaceTemplate {
  id: string;
  title: string;
  description: string;
  sourceTemplate: WorkflowTemplate;
}

export interface AiBuilderResult {
  workflow: StudioWorkflow;
  rationale: string;
}

export interface CollaborationComment {
  id: string;
  author: string;
  message: string;
  nodeId?: string;
  createdAt: string;
}

export interface CollaborationVersion {
  id: string;
  label: string;
  createdBy: string;
  createdAt: string;
}

export type WorkflowConverter = (studio: StudioWorkflow) => WorkflowDefinition;
