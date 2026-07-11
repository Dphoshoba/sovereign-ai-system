"use client";

import { useMemo, useState } from "react";
import Canvas from "./components/Canvas";
import Toolbox from "./components/Toolbox";
import Inspector from "./components/Inspector";
import ValidationPanel from "./components/ValidationPanel";
import SimulatorPanel from "./components/SimulatorPanel";
import Timeline from "./components/Timeline";
import MarketplacePanel from "./components/MarketplacePanel";
import AiBuilderPanel from "./components/AiBuilderPanel";
import CollaborationPanel from "./components/CollaborationPanel";
import { getConnectorPalette } from "../../src/lib/gamma-studio/connector-palette";
import {
  MOCK_COLLABORATORS,
  MOCK_COMMENTS,
  MOCK_MARKETPLACE_TEMPLATES,
  MOCK_STUDIO_WORKFLOW,
  MOCK_VERSIONS,
} from "../../src/lib/gamma-studio/mock-data";
import { validateStudioWorkflow } from "../../src/lib/gamma-studio/studio-validator";
import { simulateStudioWorkflow } from "../../src/lib/gamma-studio/simulator";
import type { StudioEdge, StudioNode, StudioSimulationResult } from "../../src/lib/gamma-studio/types";

function deterministicId(prefix: string, value: number): string {
  return `${prefix}_${String(value).padStart(3, "0")}`;
}

export default function GammaStudioPage() {
  const [nodes, setNodes] = useState<StudioNode[]>(MOCK_STUDIO_WORKFLOW.nodes);
  const [edges, setEdges] = useState<StudioEdge[]>(MOCK_STUDIO_WORKFLOW.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(nodes[0]?.id ?? null);
  const [simulation, setSimulation] = useState<StudioSimulationResult | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [activeEdgeId, setActiveEdgeId] = useState<string | null>(null);
  const [isPreviewRunning, setIsPreviewRunning] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatedLabel, setGeneratedLabel] = useState("");
  const [nodeSeed, setNodeSeed] = useState(20);
  const [edgeSeed, setEdgeSeed] = useState(20);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const workflow = useMemo(
    () => ({
      id: "studio_workflow_live",
      name: "Gamma Studio Workflow",
      previewOnly: true as const,
      nodes,
      edges,
    }),
    [nodes, edges]
  );

  const validation = useMemo(() => validateStudioWorkflow(workflow), [workflow]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <h1 className="text-2xl font-semibold mb-4">Gamma Studio</h1>
      <p className="text-sm text-slate-300 mb-4">
        Visual authoring and preview layer over Gamma Flow (prototype, preview-only).
      </p>

      <div className="grid grid-cols-12 gap-4 mb-4">
        <section className="col-span-3 space-y-4">
          <Toolbox connectors={getConnectorPalette()} />
          <MarketplacePanel
            templates={MOCK_MARKETPLACE_TEMPLATES}
            onInstallTemplate={(templateId) => {
              const template = MOCK_MARKETPLACE_TEMPLATES.find((t) => t.id === templateId);
              if (!template) return;
              const base = template.sourceTemplate.baseWorkflow;

              const nextNodes: StudioNode[] = [];
              let localNodeSeed = nodeSeed;
              base.steps.forEach((step, index) => {
                localNodeSeed += 1;
                nextNodes.push({
                  id: deterministicId("node", localNodeSeed),
                  type: step.type,
                  name: step.name,
                  connectorName: step.connectorName,
                  actionId: step.actionId,
                  position: { x: 120 + index * 180, y: 220 },
                  config: {},
                  oauthStatus: "connected",
                  health: "healthy",
                  rateLimit: "ok",
                  permissions: ["read"],
                  outputPreview: `${step.name} preview`,
                });
              });
              setNodeSeed(localNodeSeed);
              setNodes(nextNodes);

              let localEdgeSeed = edgeSeed;
              const nextEdges: StudioEdge[] = base.edges.map((_, idx) => {
                localEdgeSeed += 1;
                return {
                  id: deterministicId("edge", localEdgeSeed),
                  from: nextNodes[idx]?.id ?? nextNodes[0]?.id ?? "node_001",
                  to: nextNodes[idx + 1]?.id ?? nextNodes[nextNodes.length - 1]?.id ?? "node_001",
                  type: "always",
                };
              });
              setEdgeSeed(localEdgeSeed);
              setEdges(nextEdges);
              setSelectedNodeId(nextNodes[0]?.id ?? null);
            }}
          />
          <AiBuilderPanel
            prompt={aiPrompt}
            onChangePrompt={setAiPrompt}
            generatedLabel={generatedLabel}
            onGenerate={() => {
              const normalized = aiPrompt.toLowerCase();
              if (normalized.includes("every monday") && normalized.includes("gmail") && normalized.includes("slack")) {
                setGeneratedLabel("Weekly Executive Brief");
              } else if (normalized.includes("gmail") && normalized.includes("slack")) {
                setGeneratedLabel("Gmail to Slack Priority");
              } else if (normalized.includes("weekly") || normalized.includes("executive")) {
                setGeneratedLabel("Weekly Executive Brief");
              } else if (normalized.includes("triage") || normalized.includes("unread")) {
                setGeneratedLabel("Gmail Triage");
              } else {
                setGeneratedLabel("No deterministic intent match");
              }
            }}
          />
        </section>

        <section className="col-span-6 space-y-4">
          <Canvas
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNodeId}
            onChangeNodes={setNodes}
            onChangeEdges={setEdges}
            onSelectNode={setSelectedNodeId}
            onCreateNode={(payload) => {
              const id = deterministicId("node", nodeSeed + 1);
              setNodeSeed((v) => v + 1);
              const nextNode: StudioNode = {
                id,
                type: payload.type,
                name: payload.name,
                connectorName: payload.connectorName,
                actionId: payload.actionId,
                position: payload.position,
                config: {},
                oauthStatus: "connected",
                health: "healthy",
                rateLimit: "ok",
                permissions: ["read"],
                outputPreview: `${payload.name} preview`,
              };
              setNodes((prev) => [...prev, nextNode]);
            }}
            onCreateEdge={(from, to) => {
              const id = deterministicId("edge", edgeSeed + 1);
              setEdgeSeed((v) => v + 1);
              setEdges((prev) => [...prev, { id, from, to, type: "always" }]);
            }}
            activeNodeId={activeNodeId}
            activeEdgeId={activeEdgeId}
            onDeleteNode={(nodeId) => {
              setNodes((prev) => prev.filter((n) => n.id !== nodeId));
              setEdges((prev) => prev.filter((e) => e.from !== nodeId && e.to !== nodeId));
              if (selectedNodeId === nodeId) setSelectedNodeId(null);
            }}
            onDeleteEdge={(edgeId) => {
              setEdges((prev) => prev.filter((e) => e.id !== edgeId));
            }}
          />

          <ValidationPanel result={validation} />

          <SimulatorPanel
            simulation={simulation}
            onStartPreview={() => {
              const result = simulateStudioWorkflow(workflow);
              setSimulation({ ...result, status: "running" });
              setIsPreviewRunning(true);
              setActiveNodeId(null);
              setActiveEdgeId(null);

              const sequenceNodeIds = result.events
                .filter((e) => !!e.nodeId)
                .map((e) => e.nodeId as string);

              sequenceNodeIds.forEach((nodeId, idx) => {
                setTimeout(() => {
                  setActiveNodeId(nodeId);
                  const edge = edges.find((e) => e.to === nodeId);
                  setActiveEdgeId(edge?.id ?? null);
                }, idx * 450);
              });

              setTimeout(() => {
                setIsPreviewRunning(false);
                setActiveNodeId(null);
                setActiveEdgeId(null);
                setSimulation(result);
              }, Math.max(800, sequenceNodeIds.length * 450 + 300));
            }}
            onCancelPreview={() => {
              const firstNodeId = nodes[0]?.id;
              const cancelled = simulateStudioWorkflow(workflow, { cancelAtNodeId: firstNodeId });
              setSimulation({ ...cancelled, status: "cancelled_preview" });
              setIsPreviewRunning(false);
              setActiveNodeId(null);
              setActiveEdgeId(null);
            }}
          />
          <Timeline events={simulation?.events ?? []} />
        </section>

        <section className="col-span-3 space-y-4">
          <Inspector node={selectedNode} />
          <CollaborationPanel
            collaborators={MOCK_COLLABORATORS}
            comments={MOCK_COMMENTS}
            versions={MOCK_VERSIONS}
          />
        </section>
      </div>
    </main>
  );
}
