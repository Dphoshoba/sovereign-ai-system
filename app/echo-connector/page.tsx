'use client';

import { useState, useEffect } from 'react';

interface EchoSummary {
  total: number;
  recent: number;
  status: string;
}

export default function EchoConnectorDashboard() {
  const [summary, setSummary] = useState<EchoSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/connectors/echo/status');
        if (res.ok) setSummary(await res.json());
      } catch (e) {
        console.error('Failed to load echo status', e);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Echo Service Connector</h1>
        <p className="text-slate-600 mb-8">Gamma Platform — Phase XVI</p>

        {loading && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <p className="text-slate-600">Loading...</p>
          </div>
        )}

        {!loading && summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="text-sm text-slate-600">Total Resources</div>
              <div className="text-3xl font-bold text-slate-900 mt-2">{summary.total}</div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="text-sm text-slate-600">Recent (7 days)</div>
              <div className="text-3xl font-bold text-slate-900 mt-2">{summary.recent}</div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="text-sm text-slate-600">Status</div>
              <div className="text-3xl font-bold text-slate-900 mt-2 capitalize">{summary.status}</div>
            </div>
          </div>
        )}

        {!loading && !summary && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800 font-semibold">Connector not yet configured</p>
            <p className="text-yellow-700 mt-1">
              Implement the Echo OAuth adapter, API client, and resource parser to activate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
