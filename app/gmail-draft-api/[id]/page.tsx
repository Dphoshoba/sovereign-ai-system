'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DraftReceipt } from '@/src/lib/gmail-api/types';

export default function GmailDraftDetailPage() {
  const params = useParams();
  const draftId = params.id as string;
  const [draft, setDraft] = useState<DraftReceipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch draft from API
    // For now, show placeholder
    setLoading(false);
  }, [draftId]);

  if (loading) {
    return <div className="p-8">Loading draft details...</div>;
  }

  if (!draft) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Draft Not Found</h1>
        <p className="text-gray-600">
          The draft with ID {draftId} could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Draft Details</h1>
        <div className="text-sm text-gray-600">ID: {draft.id}</div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Metadata</h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Execution ID</div>
              <div className="font-mono text-sm">{draft.executionId}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Gmail Account</div>
              <div>{draft.gmailAccount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Mode</div>
              <div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    draft.mode === 'simulation'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {draft.mode}
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    draft.status === 'created'
                      ? 'bg-green-100 text-green-800'
                      : draft.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {draft.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Properties</h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Draft ID</div>
              <div className="font-mono text-sm">{draft.draftId}</div>
            </div>
            {draft.gmailDraftId && (
              <div>
                <div className="text-sm text-gray-600">Gmail Draft ID</div>
                <div className="font-mono text-sm">{draft.gmailDraftId}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-600">Created Time</div>
              <div>{draft.createdTime.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Size</div>
              <div>{draft.size} bytes</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Preview</h2>
        <div className="bg-gray-50 p-4 rounded-lg border">
          <p className="text-gray-700">{draft.preview}</p>
        </div>
      </div>

      {draft.error && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-700">{draft.error}</p>
        </div>
      )}
    </div>
  );
}
