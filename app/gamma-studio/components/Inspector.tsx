"use client";

import { useState, type ReactNode } from "react";
import type { StudioNode } from "../../../src/lib/gamma-studio/types";
import { ConnectorIcon } from "./ConnectorIcon";

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
    <div className="rounded-md border border-zinc-700">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between bg-zinc-900 px-3 py-2 text-xs"
      >
        <span>{title}</span>
        <span>{open ? "-" : "+"}</span>
      </button>
      {open ? <div className="px-3 py-2 text-xs text-zinc-300">{children}</div> : null}
    </div>
  );
}

export default function Inspector({ node }: InspectorProps) {
  if (!node) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
        No node selected.
      </div>
    );
  }

  const iconKey = (node.connectorName ?? node.type ?? "").toLowerCase();

  return (
    <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="text-lg font-medium">Workflow Inspector</h2>
      <div className="flex items-center gap-2 text-sm">
        <ConnectorIcon id={iconKey} />
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
        {Object.keys(node.config ?? {}).length === 0
          ? "Default configuration"
          : JSON.stringify(node.config)}
      </Section>
      <Section title="Output Preview" defaultOpen>
        {node.outputPreview ?? "Preview available"}
      </Section>
    </div>
  );
}
