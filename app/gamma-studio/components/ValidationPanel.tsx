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
      <div className="h-2 rounded bg-slate-800 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

export default function ValidationPanel({ result }: ValidationPanelProps) {
  const errors = result.issues.filter((i: StudioValidationIssue) => i.severity === "error");
  const warnings = result.issues.filter((i: StudioValidationIssue) => i.severity === "warning");

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h3 className="text-base font-semibold mb-3">Live Validation</h3>

      <div className="space-y-3 mb-3">
        <ScoreBar label="Validation Score" value={result.validationScore} color="bg-cyan-500" />
        <ScoreBar label="Safety Score" value={result.safetyScore} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="rounded bg-slate-800 px-2 py-1">
          Save Ready: <span className={result.saveReady ? "text-emerald-300" : "text-rose-300"}>{result.saveReady ? "Yes" : "No"}</span>
        </div>
        <div className="rounded bg-slate-800 px-2 py-1">
          Valid: <span className={result.valid ? "text-emerald-300" : "text-rose-300"}>{result.valid ? "Yes" : "No"}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <div className="text-xs text-rose-300 mb-1">Errors ({errors.length})</div>
          <ul className="space-y-1 text-xs">
            {errors.length === 0 ? (
              <li className="text-slate-400">None</li>
            ) : (
              errors.map((e: StudioValidationIssue) => <li key={e.code}>{e.message}</li>)
            )}
          </ul>
        </div>
        <div>
          <div className="text-xs text-amber-300 mb-1">Warnings ({warnings.length})</div>
          <ul className="space-y-1 text-xs">
            {warnings.length === 0 ? (
              <li className="text-slate-400">None</li>
            ) : (
              warnings.map((w: StudioValidationIssue) => <li key={w.code}>{w.message}</li>)
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
