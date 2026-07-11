"use client";

import { useState, type ReactNode } from "react";
import type { StudioNode } from "../../../src/lib/gamma-studio/types";
import { getConnectorIcon } from "./Toolbox";

type InspectorProps = {
  node: StudioNode | null;
};

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded border border-slate-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs bg-slate-800"
      >
        <span>{title}</span>
        <span>{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="px-3 py-2 text-xs text-slate-300">{children}</div> : null}
    </div>
  );
}

export default function Inspector({ node }: InspectorProps) {
  if (!node) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
        Select a node to inspect connector details.
      </div>
    );
  }

  const iconKey = (node.connectorName ?? node.type ?? "").toLowerCase();

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
      <h2 className="text-lg font-medium">Workflow Inspector</h2>
      <div className="text-sm flex items-center gap-2">
        <span aria-hidden>{getConnectorIcon(iconKey)}</span>
        <span>
          <strong>Connector:</strong> {node.connectorName ?? node.type}
        </span>
      </div>
      <Section title="OAuth" defaultOpen>
        Status: {node.oauthStatus ?? "connected"}
      </Section>
      <Section title="Permissions" defaultOpen>
        {(node.permissions ?? ["read", "write"]).join(", ")}
      </Section>
      <Section title="Rate Limits" defaultOpen>
        {node.rateLimit ?? "ok"}
      </Section>
      <Section title="Health" defaultOpen>
        {node.health ?? "healthy"}
      </Section>
      <Section title="Configuration" defaultOpen>
        {Object.keys(node.config ?? {}).length === 0 ? "Default configuration" : JSON.stringify(node.config)}
      </Section>
      <Section title="Output Preview" defaultOpen>
        {node.outputPreview ?? "Preview available"}
      </Section>
    </div>
  );
}
