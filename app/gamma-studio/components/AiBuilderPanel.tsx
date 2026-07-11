"use client";

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
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h3 className="text-base font-semibold mb-1">AI Builder</h3>
      <p className="text-xs text-amber-300 mb-3">
        Prototype only — deterministic local intent matching. No external AI calls.
      </p>
      <textarea
        value={prompt}
        onChange={(e) => onChangePrompt(e.target.value)}
        rows={4}
        className="w-full rounded bg-slate-800 p-2 text-xs border border-slate-700"
        placeholder="Describe workflow..."
      />
      <button
        type="button"
        onClick={onGenerate}
        className="mt-2 rounded bg-cyan-600 px-3 py-1 text-xs font-medium"
      >
        Generate (Deterministic)
      </button>
      <div className={`mt-2 text-xs ${failure ? "text-rose-300" : "text-slate-300"}`}>
        Generated: {generatedLabel || "None"}
      </div>
      {failure ? (
        <div className="mt-1 text-[11px] text-rose-300">
          Unsupported intent handled safely. No workflow mutation was applied.
        </div>
      ) : null}
    </div>
  );
}
