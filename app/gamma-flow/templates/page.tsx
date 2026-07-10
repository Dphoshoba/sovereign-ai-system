/**
 * /gamma-flow/templates
 * Workflow Templates Gallery
 * 
 * Display all available workflow templates
 */

import type { Metadata } from 'next';
import { FlowRegistryReader, initializeFlowRegistry } from '../../../lib/gamma/flow-registry-reader';

export const metadata: Metadata = {
  title: 'Workflow Templates | Gamma Flow',
  description: 'Browse and preview workflow templates',
};

export default async function TemplatesPage() {
  initializeFlowRegistry();
  const registry = new FlowRegistryReader();
  const templates = registry.getTemplates();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Workflow Templates</h1>
          <p className="text-slate-400">
            {templates.length} template{templates.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <a
              key={template.id}
              href={`/gamma-flow/${template.id}`}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-6 transition group"
            >
              {/* Title */}
              <h3 className="text-white font-semibold mb-2 group-hover:text-blue-400 transition">
                {template.name}
              </h3>

              {/* Description */}
              <p className="text-slate-400 text-sm mb-4 line-clamp-2">{template.description}</p>

              {/* Metadata */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Version</span>
                  <span className="text-slate-300">{template.version}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Steps</span>
                  <span className="text-slate-300">{template.definition.steps.length}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Usage</span>
                  <span className="text-slate-300">{template.usage} previews</span>
                </div>
              </div>

              {/* Tags */}
              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA */}
              <div className="text-slate-500 text-xs mt-4 group-hover:text-blue-400 transition">
                → View template
              </div>
            </a>
          ))}
        </div>

        {/* Empty State */}
        {templates.length === 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
            <p className="text-slate-400">No templates available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
