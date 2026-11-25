import { validateWorkflowDefinition } from "../gamma-flow/schema";
import { convertStudioToWorkflowDefinition } from "./workflow-converter";
import type { StudioNode, StudioValidationIssue, StudioValidationResult, StudioWorkflow } from "./types";

const SECRET_LIKE = /(api[_-]?key|secret|token|password)/i;

function isMutating(node: StudioNode): boolean {
  if (node.type !== "connector") return false;
  const action = node.actionId ?? "";
  return /create|send|write|delete|update/i.test(action);
}

function hasCycle(workflow: StudioWorkflow): boolean {
  const graph = new Map<string, string[]>();
  workflow.nodes.forEach((n) => graph.set(n.id, []));
  workflow.edges.forEach((e) => {
    const list = graph.get(e.from);
    if (list) list.push(e.to);
  });

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const dfs = (nodeId: string): boolean => {
    if (visiting.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visiting.add(nodeId);
    const next = graph.get(nodeId) ?? [];
    for (const child of next) {
      if (dfs(child)) return true;
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  };

  for (const id of graph.keys()) {
    if (dfs(id)) return true;
  }

  return false;
}

export function validateStudioWorkflow(workflow: StudioWorkflow): StudioValidationResult {
  const issues: StudioValidationIssue[] = [];
  const nodesById = new Map(workflow.nodes.map((n) => [n.id, n]));
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();

  workflow.nodes.forEach((n) => {
    incoming.set(n.id, 0);
    outgoing.set(n.id, 0);
  });

  workflow.edges.forEach((e) => {
    if (!nodesById.has(e.from) || !nodesById.has(e.to)) {
      issues.push({
        code: "invalid_edge",
        severity: "error",
        message: `Invalid edge reference ${e.id}`,
        location: e.id,
      });
      return;
    }
    outgoing.set(e.from, (outgoing.get(e.from) ?? 0) + 1);
    incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
  });

  const triggerCount = workflow.nodes.filter((n) => n.type === "trigger").length;
  if (triggerCount < 1) {
    issues.push({
      code: "missing_trigger",
      severity: "error",
      message: "Workflow requires at least one trigger node.",
    });
  }

  const sinkCount = workflow.nodes.filter((n) => n.type === "sink").length;
  if (sinkCount < 1) {
    issues.push({
      code: "missing_terminal",
      severity: "error",
      message: "Workflow requires at least one terminal sink node.",
    });
  }

  workflow.nodes.forEach((node) => {
    const inDegree = incoming.get(node.id) ?? 0;
    const outDegree = outgoing.get(node.id) ?? 0;
    const disconnected = node.type === "trigger" ? outDegree === 0 : inDegree === 0 && outDegree === 0;
    if (disconnected) {
      issues.push({
        code: "disconnected_node",
        severity: "warning",
        message: `Node ${node.name} is disconnected.`,
        location: node.id,
      });
    }

    if (node.type === "connector" && !node.actionId) {
      issues.push({
        code: "missing_connector_action",
        severity: "error",
        message: `Connector ${node.name} missing action.`,
        location: node.id,
      });
    }

    if (node.type === "connector" && (node.oauthStatus ?? "missing") !== "connected") {
      issues.push({
        code: "missing_oauth",
        severity: "error",
        message: `Connector ${node.name} missing OAuth.`,
        location: node.id,
      });
    }

    Object.values(node.config).forEach((v) => {
      if (typeof v === "string" && SECRET_LIKE.test(v)) {
        issues.push({
          code: "secret_like_value",
          severity: "warning",
          message: `Potential secret-like value detected in ${node.name}.`,
          location: node.id,
        });
      }
    });
  });

  if (hasCycle(workflow)) {
    issues.push({
      code: "unsafe_cycle",
      severity: "error",
      message: "Unsafe cycle detected in workflow graph.",
    });
  }

  const hasApproval = workflow.nodes.some((n) => n.type === "approval");
  const hasQueue = workflow.nodes.some((n) => n.type === "queue");
  const mutatingNodes = workflow.nodes.filter((n) => isMutating(n));

  if (mutatingNodes.length > 0 && !hasApproval) {
    issues.push({
      code: "mutation_without_approval",
      severity: "error",
      message: "Mutating connector action requires approval node.",
    });
  }

  if (mutatingNodes.length > 0 && !hasQueue) {
    issues.push({
      code: "missing_queue",
      severity: "error",
      message: "Execution path with mutating action requires queue node.",
    });
  }

  const converted = convertStudioToWorkflowDefinition(workflow);
  const schemaCheck = validateWorkflowDefinition(converted);
  if (!schemaCheck.valid) {
    (schemaCheck.errors ?? []).forEach((err, index) => {
      issues.push({
        code: `schema_error_${index + 1}`,
        severity: "error",
        message: err,
      });
    });
  }

  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;

  const validationScore = Math.max(0, 100 - errors * 18 - warnings * 6);
  const safetyScore = Math.max(0, 100 - errors * 20 - warnings * 4);
  const saveReady = errors === 0;

  return {
    valid: errors === 0,
    saveReady,
    validationScore,
    safetyScore,
    issues,
  };
}
