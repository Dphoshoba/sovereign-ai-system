"use client";

import type { StudioNode } from "../../../src/lib/gamma-studio/types";
import { getConnectorIcon } from "./Toolbox";

type NodeCardProps = {
  node: StudioNode;
  selected: boolean;
  active?: boolean;
  transform?: string;
  onSelect: (id: string) => void;
};

export default function NodeCard({
  node,
  selected,
  active = false,
  transform,
  onSelect,
}: NodeCardProps) {
  const iconKey = (node.connectorName ?? node.type ?? "").toLowerCase();

  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      className={`absolute w-44 rounded-lg border px-3 py-2 text-left transition-all ${
        active
          ? "border-emerald-400 bg-emerald-950/50 shadow-[0_0_20px_rgba(16,185,129,0.45)]"
          : selected
          ? "border-cyan-400 bg-cyan-950/40"
          : "border-slate-700 bg-slate-800 hover:border-slate-500"
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
        transform,
      }}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span aria-hidden>{getConnectorIcon(iconKey)}</span>
        <span>{node.name}</span>
      </div>
      <div className="text-xs text-slate-400">{node.connectorName ?? node.type}</div>
    </button>
  );
}
