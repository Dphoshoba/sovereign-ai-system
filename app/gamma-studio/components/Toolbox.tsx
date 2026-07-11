"use client";

export type ConnectorDefinition = {
  id: string;
  name: string;
  category: string;
};

type ToolboxProps = {
  connectors: ConnectorDefinition[];
};

const CONNECTOR_ICONS: Record<string, string> = {
  gmail: "📧",
  calendar: "📅",
  slack: "💬",
  github: "🐙",
  drive: "🗂️",
  office365: "🧩",
  notion: "📝",
  discord: "🎮",
  approval: "✅",
  trigger: "⚡",
  queue: "📬",
};

export function getConnectorIcon(connectorId: string): string {
  return CONNECTOR_ICONS[connectorId] ?? "🔌";
}

export default function Toolbox({ connectors }: ToolboxProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h2 className="text-lg font-medium mb-3">Connector Palette</h2>
      <div className="space-y-2">
        {connectors.map((connector) => (
          <div
            key={connector.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData(
                "application/gamma-connector",
                JSON.stringify(connector)
              );
            }}
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 cursor-grab active:cursor-grabbing flex items-center gap-2"
          >
            <span aria-hidden>{getConnectorIcon(connector.id)}</span>
            <div>
              <div className="font-medium">{connector.name}</div>
              <div className="text-xs text-slate-400">{connector.category}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
