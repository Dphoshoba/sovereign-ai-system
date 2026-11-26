"use client";

import { Play, Square } from "lucide-react";
import type { StudioSimulationResult } from "../../../src/lib/gamma-studio/types";

type SimulatorPanelProps = {
  simulation: StudioSimulationResult | null;
  onStartPreview: () => void;
  onCancelPreview: () => void;
};

export default function SimulatorPanel({
  simulation,
  onStartPreview,
  onCancelPreview,
}: SimulatorPanelProps) {
  const currentEvent = simulation?.events[simulation.events.length - 1];

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <h3 className="mb-3 text-base font-semibold">Visual Simulator</h3>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={onStartPreview}
          className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-3 py-1 text-xs font-medium text-white hover:bg-cyan-500"
        >
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          Start
        </button>
        <button
          type="button"
          onClick={onCancelPreview}
          className="inline-flex items-center gap-2 rounded-md bg-zinc-800 px-3 py-1 text-xs hover:bg-zinc-700"
        >
          <Square className="h-3.5 w-3.5" aria-hidden="true" />
          Cancel
        </button>
      </div>

      <div className="space-y-1 text-xs">
        <div>Status: {simulation?.status ?? "idle"}</div>
        <div>Current Step: {currentEvent?.message ?? "N/A"}</div>
        <div>Approval Wait: {simulation?.events.some((event) => event.type === "approval_wait") ? "Yes" : "No"}</div>
        <div>Queue Checkpoint: {simulation?.events.some((event) => event.type === "queue") ? "Reached" : "Not reached"}</div>
      </div>
    </div>
  );
}
