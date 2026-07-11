"use client";

import { Download } from "lucide-react";
import type { StudioMarketplaceTemplate } from "../../../src/lib/gamma-studio/types";

type MarketplacePanelProps = {
  templates: StudioMarketplaceTemplate[];
  onInstallTemplate: (templateId: string) => void;
};

export default function MarketplacePanel({
  templates,
  onInstallTemplate,
}: MarketplacePanelProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <h3 className="mb-3 text-base font-semibold">Marketplace</h3>
      <div className="space-y-2">
        {templates.map((template) => (
          <div key={template.id} className="rounded-md border border-zinc-700 p-3">
            <div className="font-medium text-sm">{template.title}</div>
            <div className="mb-2 text-xs text-zinc-400">{template.description}</div>
            <button
              type="button"
              onClick={() => onInstallTemplate(template.id)}
              className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-2 py-1 text-xs font-medium text-white hover:bg-cyan-500"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Install
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
