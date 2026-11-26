"use client";

import type { StudioEdge, StudioNode } from "../../../src/lib/gamma-studio/types";

type EdgeRendererProps = {
  nodes: StudioNode[];
  edges: StudioEdge[];
  activeEdgeId?: string | null;
  transform?: string;
  onDeleteEdge?: (edgeId: string) => void;
};

export default function EdgeRenderer({
  nodes,
  edges,
  activeEdgeId,
  transform,
  onDeleteEdge,
}: EdgeRendererProps) {
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg className="absolute inset-0 w-full h-full" style={{ transform }}>
      {edges.map((edge) => {
        const from = byId.get(edge.from);
        const to = byId.get(edge.to);
        if (!from || !to) return null;

        const x1 = from.position.x + 176;
        const y1 = from.position.y + 24;
        const x2 = to.position.x;
        const y2 = to.position.y + 24;
        const active = edge.id === activeEdgeId;

        return (
          <g key={edge.id}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={active ? "#22c55e" : "#22d3ee"}
              strokeWidth={active ? 3 : 2}
              strokeDasharray={active ? "0" : "4 2"}
              className={active ? "animate-pulse" : ""}
            />
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="transparent"
              strokeWidth={12}
              onClick={() => onDeleteEdge?.(edge.id)}
              className="cursor-pointer"
            />
          </g>
        );
      })}
    </svg>
  );
}
