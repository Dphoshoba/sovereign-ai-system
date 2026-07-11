"use client";

import type { CollaborationComment, CollaborationVersion } from "../../../src/lib/gamma-studio/types";

type Collaborator = {
  id: string;
  name: string;
  role: string;
};

type CollaborationPanelProps = {
  collaborators: Collaborator[];
  comments: CollaborationComment[];
  versions: CollaborationVersion[];
};

export default function CollaborationPanel({ collaborators, comments, versions }: CollaborationPanelProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h3 className="text-base font-semibold mb-3">Collaboration (Mock)</h3>
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <div className="font-medium mb-1">Collaborators</div>
          <ul className="space-y-1">
            {collaborators.map((c) => (
              <li key={c.id} className="rounded bg-slate-800 p-2">{c.name} — {c.role}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-medium mb-1">Comments</div>
          <ul className="space-y-1">
            {comments.map((c) => (
              <li key={c.id} className="rounded bg-slate-800 p-2">{c.author}: {c.message}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-medium mb-1">Version History</div>
          <ul className="space-y-1">
            {versions.map((v) => (
              <li key={v.id} className="rounded bg-slate-800 p-2">{v.label} by {v.createdBy}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
