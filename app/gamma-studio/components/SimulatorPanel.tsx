"use client";

import type { StudioSimulationResult } from "../../../src/lib/gamma-studio/types";

type SimulatorPanelProps = {
  simulation: StudioSimulationResult | null;
  onStartPreview: () => void;
  onCancelPreview: () => void;
};

export default function SimulatorPanel({ simulation, onStartPreview, onCancelPreview }: SimulatorPanelProps) {
  const currentEvent = simulation?.events[simulation.events.length - 1];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h3 className="text-base font-semibold mb-3">Visual Simulator (Preview Only)</h3>

      <div className="flex gap-2 mb-3">
        <button type="button" onClick={onStartPreview} className="rounded bg-cyan-600 px-3 py-1 text-xs font-medium">
          Start Preview
        </button>
        <button type="button" onClick={onCancelPreview} className="rounded bg-slate-700 px-3 py-1 text-xs">
          Cancel Preview
        </button>
      </div>

      <div className="text-xs space-y-1">
        <div>Status: {simulation?.status ?? "idle"}</div>
        <div>Current Step: {currentEvent?.message ?? "N/A"}</div>
        <div>Approval Wait: {simulation?.events.some((e) => e.type === "approval_wait") ? "Yes" : "No"}</div>
        <div>Queue Checkpoint: {simulation?.events.some((e) => e.type === "queue") ? "Reached" : "Not reached"}</div>
      </div>
    </div>
  );
}
