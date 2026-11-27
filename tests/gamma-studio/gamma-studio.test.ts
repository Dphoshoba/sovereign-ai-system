import { describe, expect, it } from "vitest";
import { getConnectorPalette } from "../../src/lib/gamma-studio/connector-palette";
import { MOCK_STUDIO_WORKFLOW } from "../../src/lib/gamma-studio/mock-data";
import { simulateStudioWorkflow } from "../../src/lib/gamma-studio/simulator";
import { validateStudioWorkflow } from "../../src/lib/gamma-studio/studio-validator";
import type { StudioWorkflow } from "../../src/lib/gamma-studio/types";
import { convertStudioToWorkflowDefinition } from "../../src/lib/gamma-studio/workflow-converter";

describe("Gamma Studio", () => {
  it("registers the Phase XV connector palette plus control nodes", () => {
    const palette = getConnectorPalette();
    const ids = palette.map((connector) => connector.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        "gmail",
        "calendar",
        "slack",
        "github",
        "drive",
        "microsoft-365",
        "notion",
        "discord",
        "stripe",
        "salesforce",
        "hubspot",
        "dropbox",
        "onedrive",
        "sharepoint",
        "approval",
        "queue",
      ])
    );
    expect(palette.find((connector) => connector.id === "approval")?.nodeType).toBe(
      "approval"
    );
  });

  it("keeps the mock workflow save-ready and deterministic", () => {
    const first = validateStudioWorkflow(MOCK_STUDIO_WORKFLOW);
    const second = validateStudioWorkflow(MOCK_STUDIO_WORKFLOW);

    expect(first.valid).toBe(true);
    expect(first.saveReady).toBe(true);
    expect(first).toEqual(second);
  });

  it("blocks mutating connector workflows without approval and queue", () => {
    const unsafe: StudioWorkflow = {
      id: "unsafe_studio_workflow",
      name: "Unsafe Studio Workflow",
      previewOnly: true,
      nodes: [
        {
          id: "trigger_001",
          type: "trigger",
          name: "Start",
          position: { x: 0, y: 0 },
          config: {},
        },
        {
          id: "node_001",
          type: "connector",
          name: "Slack",
          connectorName: "slack",
          actionId: "send_message",
          position: { x: 200, y: 0 },
          config: {},
          oauthStatus: "connected",
        },
        {
          id: "sink_001",
          type: "sink",
          name: "Done",
          position: { x: 400, y: 0 },
          config: {},
        },
      ],
      edges: [
        { id: "edge_001", from: "trigger_001", to: "node_001", type: "always" },
        { id: "edge_002", from: "node_001", to: "sink_001", type: "success" },
      ],
    };

    const result = validateStudioWorkflow(unsafe);

    expect(result.valid).toBe(false);
    expect(result.saveReady).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["mutation_without_approval", "missing_queue"])
    );
  });

  it("simulates preview execution without mutating the workflow", () => {
    const before = JSON.stringify(MOCK_STUDIO_WORKFLOW);
    const result = simulateStudioWorkflow(MOCK_STUDIO_WORKFLOW);

    expect(result.status).toBe("waiting_approval");
    expect(result.events.some((event) => event.type === "approval_wait")).toBe(true);
    expect(JSON.stringify(MOCK_STUDIO_WORKFLOW)).toBe(before);
  });

  it("converts studio workflows into Gamma Flow definitions", () => {
    const definition = convertStudioToWorkflowDefinition(MOCK_STUDIO_WORKFLOW);

    expect(definition.id).toBe(`wf_${MOCK_STUDIO_WORKFLOW.id}`);
    expect(definition.previewMode).toBe(true);
    expect(definition.enableAudit).toBe(true);
    expect(definition.steps.length).toBe(
      MOCK_STUDIO_WORKFLOW.nodes.filter((node) => node.type !== "trigger").length
    );
  });
});
