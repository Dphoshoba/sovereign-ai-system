/**
 * /gamma-flow/[id]
 * Workflow Detail Page
 * 
 * Display workflow definition with validation scores, graph, safety metrics
 */

import type { Metadata } from 'next';
import { validateWorkflow } from '../../../lib/flow/workflow-validator';
import { compileWorkflow } from '../../../lib/flow/workflow-compiler';
import { FlowRegistryReader, initializeFlowRegistry } from '../../../lib/gamma/flow-registry-reader';

export const metadata: Metadata = {
  title: 'Workflow | Gamma Flow',
  description: 'Workflow definition and validation',
};

interface PageProps {
  params: { id: string };
}

export default async function WorkflowDetailPage({ params }: PageProps) {
  initializeFlowRegistry();
  const registry = new FlowRegistryReader();
  const template = registry.getTemplate(params.id);

  if (!template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
            <h1 className="text-white font-semibold">Workflow not found</h1>
            <p className="text-slate-400 mt-2">ID: {params.id}</p>
          </div>
        </div>
      </div>
    );
  }

  // Validate workflow
  const validation = validateWorkflow(template.definition);

  // Compile workflow
  const compiled = compileWorkflow(template.definition);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a href="/gamma-flow" className="text-slate-400 hover:text-white text-sm">
            ← Back to Dashboard
          </a>
          <h1 className="text-4xl font-bold text-white mt-4 mb-2">{template.name}</h1>
          <p className="text-slate-400">{template.description}</p>
        </div>

        {/* Validation Scores */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-slate-400 text-sm font-medium mb-2">Validation Status</div>
            <div className="text-3xl font-bold text-green-400">
              {validation.valid ? '✓ Valid' : '✗ Invalid'}
            </div>
            <div className="text-slate-500 text-xs mt-2">{validation.errors.length} error(s)</div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-slate-400 text-sm font-medium mb-2">Safety Score</div>
            <div className="text-3xl font-bold text-orange-400">{validation.safetyScore}/100</div>
            <div className="text-slate-500 text-xs mt-2">Approval/queue enforcement</div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-slate-400 text-sm font-medium mb-2">Readiness Score</div>
            <div className="text-3xl font-bold text-blue-400">{validation.readinessScore}/100</div>
            <div className="text-slate-500 text-xs mt-2">Connector binding coverage</div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-slate-400 text-sm font-medium mb-2">Steps</div>
            <div className="text-3xl font-bold text-white">{template.definition.steps.length}</div>
            <div className="text-slate-500 text-xs mt-2">Workflow nodes</div>
          </div>
        </div>

        {/* Workflow Metrics */}
        {validation.metrics && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-12">
            <h3 className="text-white font-semibold mb-4">Workflow Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-slate-400">Total Nodes</div>
                <div className="text-white font-semibold">{validation.metrics.nodeCount}</div>
              </div>
              <div>
                <div className="text-slate-400">Total Edges</div>
                <div className="text-white font-semibold">{validation.metrics.edgeCount}</div>
              </div>
              <div>
                <div className="text-slate-400">Unique Connectors</div>
                <div className="text-white font-semibold">{validation.metrics.connectorCount}</div>
              </div>
              <div>
                <div className="text-slate-400">Approval Points</div>
                <div className="text-white font-semibold">{validation.metrics.approvalPointCount}</div>
              </div>
              <div>
                <div className="text-slate-400">Queue Points</div>
                <div className="text-white font-semibold">{validation.metrics.queuePointCount}</div>
              </div>
              <div>
                <div className="text-slate-400">Unsafe Cycles</div>
                <div className="text-white font-semibold">{validation.metrics.cycleCount}</div>
              </div>
              <div>
                <div className="text-slate-400">Orphan Nodes</div>
                <div className="text-white font-semibold">{validation.metrics.orphanNodeCount}</div>
              </div>
              <div>
                <div className="text-slate-400">Est. Duration</div>
                <div className="text-white font-semibold">{compiled.executionTimeEstimate}ms</div>
              </div>
            </div>
          </div>
        )}

        {/* Compilation Info */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-12">
          <h3 className="text-white font-semibold mb-4">Compilation</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-slate-400">Critical Path Length</div>
              <div className="text-white font-semibold">{compiled.criticalPath.length} nodes</div>
            </div>
            <div>
              <div className="text-slate-400">Parallelizable</div>
              <div className="text-white font-semibold">{compiled.parallelizable ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>

        {/* Validation Results */}
        {validation.errors.length > 0 && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 mb-12">
            <h3 className="text-red-300 font-semibold mb-4">Validation Errors</h3>
            <ul className="space-y-2">
              {validation.errors.map((error, idx) => (
                <li key={idx} className="text-red-200 text-sm">
                  • {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6 mb-12">
            <h3 className="text-yellow-300 font-semibold mb-4">Warnings</h3>
            <ul className="space-y-2">
              {validation.warnings.map((warning, idx) => (
                <li key={idx} className="text-yellow-200 text-sm">
                  • {warning.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-2">Preview Execution</h3>
          <p className="text-slate-300 text-sm">
            This workflow is ready for preview. Live execution will be available in Gamma Flow 2.0.
          </p>
        </div>
      </div>
    </div>
  );
}
