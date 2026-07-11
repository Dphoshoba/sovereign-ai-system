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

export default function CollaborationPanel({
  collaborators,
  comments,
  versions,
}: CollaborationPanelProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <h3 className="mb-3 text-base font-semibold">Collaboration</h3>
      <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
        <div>
          <div className="mb-1 font-medium">Collaborators</div>
          <ul className="space-y-1">
            {collaborators.map((collaborator) => (
              <li key={collaborator.id} className="rounded-md bg-zinc-900 p-2">
                {collaborator.name}: {collaborator.role}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-1 font-medium">Comments</div>
          <ul className="space-y-1">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-md bg-zinc-900 p-2">
                {comment.author}: {comment.message}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-1 font-medium">Version History</div>
          <ul className="space-y-1">
            {versions.map((version) => (
              <li key={version.id} className="rounded-md bg-zinc-900 p-2">
                {version.label} by {version.createdBy}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
