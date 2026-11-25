"use client";

import { ConnectorIcon } from "./ConnectorIcon";

export type ConnectorDefinition = {
  id: string;
  name: string;
  category: string;
  nodeType?: string;
  actions?: string[];
};

type ToolboxProps = {
  connectors: ConnectorDefinition[];
};

export default function Toolbox({ connectors }: ToolboxProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="mb-3 text-lg font-medium">Connector Palette</h2>
      <div className="grid max-h-[360px] grid-cols-1 gap-2 overflow-y-auto pr-1">
        {connectors.map((connector) => (
          <div
            key={connector.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData(
                "application/gamma-connector",
                JSON.stringify({
                  id: connector.id,
                  name: connector.name,
                  type: connector.nodeType ?? "connector",
                  actionId: connector.actions?.[0],
                })
              );
            }}
            className="flex cursor-grab items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 active:cursor-grabbing"
          >
            <ConnectorIcon id={connector.id} />
            <div>
              <div className="font-medium">{connector.name}</div>
              <div className="text-xs text-zinc-400">{connector.category}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
