"use client";

import { useMemo, useRef, useState } from "react";
import { GitBranch, Save, Trash2, Undo2 } from "lucide-react";
import EdgeRenderer from "./EdgeRenderer";
import NodeCard from "./NodeCard";
import type { StudioEdge, StudioNode } from "../../../src/lib/gamma-studio/types";

export type CanvasDropPayload = {
  type: StudioNode["type"];
  name: string;
  connectorName?: string;
  actionId?: string;
  position: { x: number; y: number };
};

type CanvasProps = {
  nodes: StudioNode[];
  edges: StudioEdge[];
  selectedNodeId: string | null;
  activeNodeId?: string | null;
  activeEdgeId?: string | null;
  onChangeNodes: (nodes: StudioNode[]) => void;
  onChangeEdges: (edges: StudioEdge[]) => void;
  onSelectNode: (id: string | null) => void;
  onCreateNode: (payload: CanvasDropPayload) => void;
  onCreateEdge: (from: string, to: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onSaveWorkflow: () => void;
  saveDisabled?: boolean;
  saveReceipt?: string;
};

export default function Canvas({
  nodes,
  edges,
  selectedNodeId,
  activeNodeId,
  activeEdgeId,
  onChangeNodes,
  onChangeEdges,
  onSelectNode,
  onCreateNode,
  onCreateEdge,
  onDeleteNode,
  onDeleteEdge,
  onSaveWorkflow,
  saveDisabled = false,
  saveReceipt,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const transform = useMemo(
    () => `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
    [offset.x, offset.y, zoom]
  );

  return (
    <div
      ref={canvasRef}
      className="relative h-[600px] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950"
      onWheel={(event) => {
        event.preventDefault();
        setZoom((z) => Math.max(0.5, Math.min(1.8, z + (event.deltaY > 0 ? -0.08 : 0.08))));
      }}
      onMouseDown={(event) => {
        if (event.button !== 1 && !(event.button === 0 && event.shiftKey)) return;
        setPanning(true);
        setDragStart({ x: event.clientX - offset.x, y: event.clientY - offset.y });
      }}
      onMouseMove={(event) => {
        if (panning) {
          setOffset({ x: event.clientX - dragStart.x, y: event.clientY - dragStart.y });
        }
        if (dragNodeId) {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          const nx = (event.clientX - rect.left - offset.x) / zoom - 88;
          const ny = (event.clientY - rect.top - offset.y) / zoom - 20;
          onChangeNodes(
            nodes.map((n) =>
              n.id === dragNodeId
                ? { ...n, position: { x: Math.max(0, nx), y: Math.max(0, ny) } }
                : n
            )
          );
        }
      }}
      onMouseUp={() => {
        setPanning(false);
        setDragNodeId(null);
      }}
      onMouseLeave={() => {
        setPanning(false);
        setDragNodeId(null);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const raw = event.dataTransfer.getData("application/gamma-connector");
        if (!raw) return;
        const payload = JSON.parse(raw) as {
          id: string;
          name: string;
          type?: StudioNode["type"];
          actionId?: string;
        };
        const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
        onCreateNode({
          type: payload.type ?? "connector",
          name: payload.name,
          connectorName: payload.type === "connector" || !payload.type ? payload.id : undefined,
          actionId: payload.actionId,
          position: {
            x: Math.max(0, (event.clientX - rect.left - offset.x) / zoom - 88),
            y: Math.max(0, (event.clientY - rect.top - offset.y) / zoom - 20),
          },
        });
      }}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, #3f3f46 1px, transparent 1px), linear-gradient(to bottom, #3f3f46 1px, transparent 1px)",
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px`,
        }}
      />
      <EdgeRenderer
        nodes={nodes}
        edges={edges}
        activeEdgeId={activeEdgeId}
        transform={transform}
        onDeleteEdge={onDeleteEdge}
      />
      {nodes.map((node) => (
        <NodeCard
          key={node.id}
          node={node}
          selected={selectedNodeId === node.id}
          active={activeNodeId === node.id}
          transform={transform}
          onSelect={(id) => onSelectNode(id)}
        />
      ))}

      {nodes.map((node) => (
        <div
          key={`${node.id}_drag`}
          className="absolute z-20"
          style={{
            width: 176,
            height: 52,
            left: node.position.x,
            top: node.position.y,
            transform,
          }}
          onMouseDown={(event) => {
            if (event.button !== 0) return;
            setDragNodeId(node.id);
            event.stopPropagation();
          }}
        />
      ))}

      <div className="absolute bottom-3 right-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          title="Connect last two nodes"
          aria-label="Connect last two nodes"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
          onClick={() => {
            if (nodes.length >= 2) {
              const from = nodes[nodes.length - 2].id;
              const to = nodes[nodes.length - 1].id;
              onCreateEdge(from, to);
            }
          }}
        >
          <GitBranch className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          title="Delete selected node"
          aria-label="Delete selected node"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-rose-700 text-white hover:bg-rose-600"
          onClick={() => {
            if (!selectedNodeId) return;
            onDeleteNode(selectedNodeId);
          }}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          title="Reset view"
          aria-label="Reset view"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
          onClick={() => {
            setZoom(1);
            setOffset({ x: 0, y: 0 });
          }}
        >
          <Undo2 className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          title="Save workflow"
          aria-label="Save workflow"
          disabled={saveDisabled}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-cyan-600 text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          onClick={onSaveWorkflow}
        >
          <Save className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {saveReceipt ? (
        <div className="absolute bottom-14 right-3 rounded-md border border-emerald-700 bg-emerald-950/90 px-3 py-2 text-xs text-emerald-200">
          {saveReceipt}
        </div>
      ) : null}

      <div className="absolute right-3 top-3 w-40 rounded-md border border-zinc-700 bg-zinc-950/90 p-2">
        <div className="mb-1 text-[10px] text-zinc-400">Minimap</div>
        <div className="relative h-24 w-full rounded-md bg-zinc-900">
          {nodes.map((n) => (
            <div
              key={`${n.id}_mini`}
              className={`absolute h-2 w-3 rounded-sm ${selectedNodeId === n.id ? "bg-cyan-400" : "bg-zinc-400"}`}
              style={{ left: `${Math.min(95, (n.position.x / 900) * 100)}%`, top: `${Math.min(85, (n.position.y / 600) * 100)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
