/**
 * /gamma-flow
 * Gamma Flow Dashboard
 * 
 * Main entry point for workflow orchestration
 * SSR-first, no browser-only state
 */

import type { Metadata } from 'next';
import { FlowRegistryReader, initializeFlowRegistry } from '../../lib/gamma/flow-registry-reader';

export const metadata: Metadata = {
  title: 'Gamma Flow',
  description: 'Workflow orchestration dashboard',
};

export default async function GammaFlowPage() {
  // Initialize registry
  initializeFlowRegistry();
  const registry = new FlowRegistryReader();

  // Get templates
  const templates = registry.getTemplates();
  const templateCount = templates.length;

  // Calculate aggregate metrics
  const totalDefinitions = templateCount;
  const activeExecutions = 0; // Would query from store in real implementation
  const completedExecutions = 0;
  const failedExecutions = 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Gamma Flow 1.0</h1>
          <p className="text-slate-400">Preview-first workflow orchestration platform</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-slate-400 text-sm font-medium mb-2">Workflow Templates</div>
            <div className="text-3xl font-bold text-white">{templateCount}</div>
            <div className="text-slate-500 text-xs mt-2">Available templates</div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-slate-400 text-sm font-medium mb-2">Active Executions</div>
            <div className="text-3xl font-bold text-blue-400">{activeExecutions}</div>
            <div className="text-slate-500 text-xs mt-2">Running in preview mode</div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-slate-400 text-sm font-medium mb-2">Completed</div>
            <div className="text-3xl font-bold text-green-400">{completedExecutions}</div>
            <div className="text-slate-500 text-xs mt-2">Preview executions</div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-slate-400 text-sm font-medium mb-2">Failed</div>
            <div className="text-3xl font-bold text-red-400">{failedExecutions}</div>
            <div className="text-slate-500 text-xs mt-2">Validation or execution errors</div>
          </div>
        </div>

        {/* Status Banner */}
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6 mb-12">
          <h2 className="text-white font-semibold mb-2">Platform Status</h2>
          <ul className="text-slate-300 text-sm space-y-1">
            <li>✓ Preview execution enabled</li>
            <li>✓ Deterministic workflows</li>
            <li>✓ Approval checkpoints enforced</li>
            <li>✓ Queue-aware execution</li>
            <li>✓ Full audit trail</li>
            <li>⊘ Live cross-connector execution (Coming in 2.0)</li>
          </ul>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="/gamma-flow/templates"
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-6 transition"
          >
            <h3 className="text-white font-semibold mb-2">Workflow Templates</h3>
            <p className="text-slate-400 text-sm">Browse and preview available templates</p>
            <div className="text-slate-500 text-xs mt-4">→ View {templateCount} templates</div>
          </a>

          <a
            href="/api/flow/workflows"
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-6 transition"
          >
            <h3 className="text-white font-semibold mb-2">API Reference</h3>
            <p className="text-slate-400 text-sm">Workflow validation and compilation API</p>
            <div className="text-slate-500 text-xs mt-4">→ API Documentation</div>
          </a>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-700 text-slate-400 text-sm">
          <p>
            Gamma Flow 1.0 is a preview-first orchestration platform with deterministic, auditable workflows.
            Live execution is coming in version 2.0.
          </p>
        </div>
      </div>
    </div>
  );
}
