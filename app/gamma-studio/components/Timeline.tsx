"use client";

import type { StudioSimulationEvent } from "../../../src/lib/gamma-studio/types";

type TimelineProps = {
  events: StudioSimulationEvent[];
};

const typeLabel: Record<string, string> = {
  running: "Running",
  approval_wait: "Waiting approval",
  queue: "Queued",
  completed_preview: "Completed",
  failed_preview: "Failed",
  cancelled_preview: "Cancelled",
};

const typeClass: Record<string, string> = {
  running: "bg-cyan-950 text-cyan-300",
  approval_wait: "bg-amber-950 text-amber-300",
  queue: "bg-indigo-950 text-indigo-300",
  completed_preview: "bg-emerald-950 text-emerald-300",
  failed_preview: "bg-rose-950 text-rose-300",
  cancelled_preview: "bg-zinc-900 text-zinc-300",
};

export default function Timeline({ events }: TimelineProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <h3 className="mb-3 text-base font-semibold">Timeline</h3>
      <ul className="space-y-2 text-xs">
        {events.length === 0 ? (
          <li className="text-zinc-400">No events yet.</li>
        ) : (
          events.map((event) => (
            <li key={event.id} className="rounded-md bg-zinc-900 p-2">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">
                  {event.time}: {event.type}
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] ${
                    typeClass[event.type] ?? "bg-zinc-800 text-zinc-200"
                  }`}
                >
                  {typeLabel[event.type] ?? event.type}
                </span>
              </div>
              <div className="text-zinc-300">{event.message}</div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
