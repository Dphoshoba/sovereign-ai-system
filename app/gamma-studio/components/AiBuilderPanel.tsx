"use client";

import { WandSparkles } from "lucide-react";

type AiBuilderPanelProps = {
  prompt: string;
  onChangePrompt: (value: string) => void;
  onGenerate: () => void;
  generatedLabel: string;
};

export default function AiBuilderPanel({
  prompt,
  onChangePrompt,
  onGenerate,
  generatedLabel,
}: AiBuilderPanelProps) {
  const failure = generatedLabel.toLowerCase().includes("no deterministic intent match");

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <h3 className="mb-3 text-base font-semibold">AI Builder</h3>
      <textarea
        value={prompt}
        onChange={(event) => onChangePrompt(event.target.value)}
        rows={4}
        className="w-full rounded-md border border-zinc-700 bg-zinc-900 p-2 text-xs"
        placeholder="Describe workflow..."
      />
      <button
        type="button"
        onClick={onGenerate}
        className="mt-2 inline-flex items-center gap-2 rounded-md bg-cyan-600 px-3 py-1 text-xs font-medium text-white hover:bg-cyan-500"
      >
        <WandSparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Generate
      </button>
      <div className={`mt-2 text-xs ${failure ? "text-rose-300" : "text-zinc-300"}`}>
        Generated: {generatedLabel || "None"}
      </div>
    </div>
  );
}
