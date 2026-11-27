/**
 * /gamma-flow/executions/[id]
 * Execution Viewer
 * 
 * Display execution history, step results, approval checkpoints, audit trail
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Execution | Gamma Flow',
  description: 'Execution history and audit trail',
};

interface PageProps {
  params: { id: string };
}

export default async function ExecutionDetailPage({ params }: PageProps) {
  const executionId = params.id;

  // In a real implementation, would fetch from database
  // For now, show placeholder

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a href="/gamma-flow" className="text-slate-400 hover:text-white text-sm">
            ← Back to Dashboard
          </a>
          <h1 className="text-4xl font-bold text-white mt-4 mb-2">Execution Details</h1>
          <p className="text-slate-400 font-mono text-sm">{executionId}</p>
        </div>

        {/* Execution Info */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-12">
          <h3 className="text-white font-semibold mb-4">Execution Metadata</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-slate-400">Execution ID</div>
              <div className="text-white font-mono">{executionId}</div>
            </div>
            <div>
              <div className="text-slate-400">Status</div>
              <div className="text-white">Data not yet persisted</div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-2">Execution Store</h3>
          <p className="text-slate-300 text-sm">
            Execution details will be stored in a persistent database in production. Currently showing 
            schema structure for preview workflows running in the CLI or testing environment.
          </p>
        </div>
      </div>
    </div>
  );
}
