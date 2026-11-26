"use client";

import type { StudioValidationIssue, StudioValidationResult } from "../../../src/lib/gamma-studio/types";

type ValidationPanelProps = {
  result: StudioValidationResult;
};

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span>{label}</span>
        <span>{safeValue}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-md bg-zinc-900">
        <div className={`h-full ${color}`} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

export default function ValidationPanel({ result }: ValidationPanelProps) {
  const errors = result.issues.filter((issue: StudioValidationIssue) => issue.severity === "error");
  const warnings = result.issues.filter((issue: StudioValidationIssue) => issue.severity === "warning");

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <h3 className="mb-3 text-base font-semibold">Live Validation</h3>

      <div className="mb-3 space-y-3">
        <ScoreBar label="Validation Score" value={result.validationScore} color="bg-cyan-500" />
        <ScoreBar label="Safety Score" value={result.safetyScore} color="bg-emerald-500" />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-zinc-900 px-2 py-1">
          Save Ready: <span className={result.saveReady ? "text-emerald-300" : "text-rose-300"}>{result.saveReady ? "Yes" : "No"}</span>
        </div>
        <div className="rounded-md bg-zinc-900 px-2 py-1">
          Valid: <span className={result.valid ? "text-emerald-300" : "text-rose-300"}>{result.valid ? "Yes" : "No"}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <div className="mb-1 text-xs text-rose-300">Errors ({errors.length})</div>
          <ul className="space-y-1 text-xs">
            {errors.length === 0 ? (
              <li className="text-zinc-400">None</li>
            ) : (
              errors.map((error: StudioValidationIssue) => <li key={error.code}>{error.message}</li>)
            )}
          </ul>
        </div>
        <div>
          <div className="mb-1 text-xs text-amber-300">Warnings ({warnings.length})</div>
          <ul className="space-y-1 text-xs">
            {warnings.length === 0 ? (
              <li className="text-zinc-400">None</li>
            ) : (
              warnings.map((warning: StudioValidationIssue) => <li key={warning.code}>{warning.message}</li>)
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
