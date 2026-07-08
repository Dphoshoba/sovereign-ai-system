import { getRuntimeKernelRegistry } from '../../lib/gamma/runtime-kernel-reader'

export const dynamic = 'force-dynamic'

export default async function RuntimeKernelPage() {
  const registry = await getRuntimeKernelRegistry()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Runtime Kernel</h1>
          <p className="text-purple-300">Core execution foundation — preview mode only</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <div className="bg-gradient-to-br from-purple-800/40 to-purple-900/40 rounded-lg border border-purple-500/30 p-6">
            <div className="text-purple-300 text-sm font-medium mb-2">Status</div>
            <div className="text-2xl font-bold text-purple-100">{registry.status}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-800/40 to-blue-900/40 rounded-lg border border-blue-500/30 p-6">
            <div className="text-blue-300 text-sm font-medium mb-2">Version</div>
            <div className="text-2xl font-bold text-blue-100">{registry.version}</div>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8 mb-12">
          <h2 className="text-xl font-bold text-white mb-6">Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Runtime Score</div>
              <div className="text-3xl font-bold text-cyan-300">{registry.metrics.runtimeScore}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Runtime Units</div>
              <div className="text-3xl font-bold text-green-300">{registry.metrics.registeredRuntimeUnits}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Preview Count</div>
              <div className="text-3xl font-bold text-amber-300">{registry.metrics.executionPreviewCount}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Safety Score</div>
              <div className="text-3xl font-bold text-red-300">{registry.metrics.safetyScore}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Approval Coverage</div>
              <div className="text-3xl font-bold text-purple-300">{registry.metrics.approvalCoverage}%</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Auditability</div>
              <div className="text-3xl font-bold text-indigo-300">{registry.metrics.auditabilityScore}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Health Score</div>
              <div className="text-3xl font-bold text-lime-300">{registry.metrics.healthScore}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Last Sync</div>
              <div className="text-sm text-slate-300">{new Date(registry.lastSync).toISOString().split('T')[0]}</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8">
          <h2 className="text-xl font-bold text-white mb-6">Registered Runtime Units ({registry.runtimeUnits.length})</h2>
          <div className="space-y-3">
            {registry.runtimeUnits.map((unit) => (
              <div key={unit.id} className="bg-slate-700/40 hover:bg-slate-700/60 transition rounded-lg p-4 border border-slate-600/50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-white">{unit.name}</h3>
                    <p className="text-slate-400 text-sm">ID: {unit.id}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-1 ${
                      unit.safetyLevel === 'critical' ? 'bg-red-500/30 text-red-200' :
                      unit.safetyLevel === 'high' ? 'bg-orange-500/30 text-orange-200' :
                      unit.safetyLevel === 'medium' ? 'bg-amber-500/30 text-amber-200' :
                      'bg-green-500/30 text-green-200'
                    }`}>
                      {unit.safetyLevel}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap text-xs">
                  <span className="bg-slate-600/50 text-slate-200 px-2 py-1 rounded">{unit.type}</span>
                  <span className="bg-slate-600/50 text-slate-200 px-2 py-1 rounded">{unit.status}</span>
                  <span className="bg-slate-600/50 text-slate-200 px-2 py-1 rounded">{unit.executionMode}</span>
                  {unit.requiresApproval && <span className="bg-blue-600/50 text-blue-200 px-2 py-1 rounded">Approval Required</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
