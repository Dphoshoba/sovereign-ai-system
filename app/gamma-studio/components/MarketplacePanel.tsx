"use client";

import type { StudioMarketplaceTemplate } from "../../../src/lib/gamma-studio/types";

type MarketplacePanelProps = {
  templates: StudioMarketplaceTemplate[];
  onInstallTemplate: (templateId: string) => void;
};

export default function MarketplacePanel({ templates, onInstallTemplate }: MarketplacePanelProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h3 className="text-base font-semibold mb-3">Marketplace</h3>
      <div className="space-y-2">
        {templates.map((template) => (
          <div key={template.id} className="rounded border border-slate-700 p-3">
            <div className="font-medium text-sm">{template.title}</div>
            <div className="text-xs text-slate-400 mb-2">{template.description}</div>
            <button
              type="button"
              onClick={() => onInstallTemplate(template.id)}
              className="rounded bg-cyan-600 px-2 py-1 text-xs font-medium"
            >
              Install
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
