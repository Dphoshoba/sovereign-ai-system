import type { StudioSimulationResult, StudioWorkflow } from "./types";

type SimulateOptions = {
  cancelAtNodeId?: string;
};

export function simulateStudioWorkflow(workflow: StudioWorkflow, options: SimulateOptions = {}): StudioSimulationResult {
  const events: StudioSimulationResult["events"] = [];
  const output: Record<string, unknown> = {};

  events.push({
    id: "evt_001",
    time: "10:02",
    type: "validation",
    message: "Validation passed for preview run.",
  });

  events.push({
    id: "evt_002",
    time: "10:02",
    type: "simulation_start",
    message: "Simulation started in preview mode.",
  });

  const sortedNodes = [...workflow.nodes].sort((a, b) => a.position.x - b.position.x);

  let eventCounter = 3;
  for (const node of sortedNodes) {
    if (options.cancelAtNodeId && options.cancelAtNodeId === node.id) {
      events.push({
        id: `evt_${String(eventCounter).padStart(3, "0")}`,
        time: "10:03",
        type: "failed_preview",
        nodeId: node.id,
        message: `Simulation cancelled at ${node.name}.`,
      });
      return {
        status: "failed_preview",
        events,
        output,
      };
    }

    if (node.type === "decision") {
      events.push({
        id: `evt_${String(eventCounter).padStart(3, "0")}`,
        time: "10:03",
        type: "decision",
        nodeId: node.id,
        message: `Decision evaluated true at ${node.name}.`,
      });
      eventCounter += 1;
      output[node.id] = "condition_true";
      continue;
    }

    if (node.type === "approval") {
      events.push({
        id: `evt_${String(eventCounter).padStart(3, "0")}`,
        time: "10:03",
        type: "approval_wait",
        nodeId: node.id,
        message: `Waiting for approval at ${node.name}.`,
      });
      eventCounter += 1;
      return {
        status: "waiting_approval",
        events,
        output,
      };
    }

    if (node.type === "queue") {
      events.push({
        id: `evt_${String(eventCounter).padStart(3, "0")}`,
        time: "10:04",
        type: "queue",
        nodeId: node.id,
        message: `Queue checkpoint reached at ${node.name}.`,
      });
      eventCounter += 1;
      output[node.id] = "queued";
      continue;
    }

    events.push({
      id: `evt_${String(eventCounter).padStart(3, "0")}`,
      time: "10:02",
      type: "connector_preview",
      nodeId: node.id,
      message: `Previewed ${node.name}.`,
    });
    eventCounter += 1;
    output[node.id] = node.outputPreview ?? `${node.name} preview`;
  }

  events.push({
    id: `evt_${String(eventCounter).padStart(3, "0")}`,
    time: "10:04",
    type: "completed_preview",
    message: "Preview simulation completed.",
  });

  return {
    status: "completed_preview",
    events,
    output,
  };
}
