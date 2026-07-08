'use client';

import React, { useState, useEffect } from 'react';
import { GmailDraftApiReader } from '@/lib/gamma/gmail-draft-api-reader';
import { DraftReceipt } from '@/src/lib/gmail-api/types';

export default function GmailDraftApiPage() {
  const [drafts, setDrafts] = useState<DraftReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    created: 0,
    failed: 0,
    simulation: 0,
    real: 0,
    successRate: 0,
  });

  useEffect(() => {
    const reader = new GmailDraftApiReader();
    
    // Load mock data for demonstration
    setDrafts(reader.getStats().totalReceipts > 0 ? [] : []);
    setStats(reader.getStats() as any);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="p-8">Loading Gmail drafts...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gmail Draft API Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Total Drafts</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Successful</div>
          <div className="text-2xl font-bold">{stats.created}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Failed</div>
          <div className="text-2xl font-bold">{stats.failed}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Simulation Mode</div>
          <div className="text-2xl font-bold">{stats.simulation}</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Real Mode</div>
          <div className="text-2xl font-bold">{stats.real}</div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Success Rate</h2>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-500 h-4 rounded-full"
            style={{ width: `${stats.successRate * 100}%` }}
          />
        </div>
        <div className="text-sm text-gray-600 mt-2">
          {(stats.successRate * 100).toFixed(1)}%
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Drafts</h2>
        {drafts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No drafts yet. Create a draft to see it here.
          </div>
        ) : (
          <div className="space-y-2">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold">{draft.gmailAccount}</div>
                    <div className="text-sm text-gray-600">{draft.preview}</div>
                  </div>
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
                <div className="text-xs text-gray-500">
                  Created: {draft.createdTime.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
