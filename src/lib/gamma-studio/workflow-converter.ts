import type { WorkflowDefinition, WorkflowEdge, WorkflowStep } from "../gamma-flow/types";
import type { StudioWorkflow } from "./types";

const BASE_DATE = new Date("2026-07-10T12:00:00.000Z");

export function convertStudioToWorkflowDefinition(studio: StudioWorkflow): WorkflowDefinition {
  const triggerNode = studio.nodes.find((n) => n.type === "trigger");

  const steps: WorkflowStep[] = studio.nodes
    .filter((n) => n.type !== "trigger")
    .map((n) => ({
      id: n.id.startsWith("step_") ? n.id : `step_${n.id}`,
      type: n.type,
      name: n.name,
      connectorName: n.connectorName,
      actionId: n.actionId,
      runInPreview: true,
      requiresApproval: n.type === "approval",
      requiresQueue: n.type === "queue",
      riskLevel: n.type === "connector" ? "medium" : "low",
      metadata: {
        studioPosition: n.position,
        oauthStatus: n.oauthStatus ?? "connected",
      },
    }));

  const edges: WorkflowEdge[] = studio.edges.map((e) => ({
    id: e.id.startsWith("edge_") ? e.id : `edge_${e.id}`,
    from: e.from,
    to: e.to,
    type: e.type,
  }));

  return {
    id: studio.id.startsWith("wf_") ? studio.id : `wf_${studio.id}`,
    name: studio.name,
    description: "Gamma Studio generated preview workflow",
    version: "1.0.0",
    trigger: {
      id: triggerNode?.id ?? "trigger_manual",
      type: "manual",
      description: "Studio preview trigger",
    },
    steps,
    edges,
    creator: "gamma-studio",
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    previewMode: true,
    enableAudit: true,
    requiresApprovalBeforeExecution: true,
    timeoutMs: 120000,
    maxRetries: 1,
  };
}
