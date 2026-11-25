import { getActionRegistryReader } from '../../lib/gamma/action-registry-reader'

export const dynamic = 'force-dynamic'

export default async function ActionRegistryPage() {
  const registry = await getActionRegistryReader()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Action Registry</h1>
          <p className="text-blue-300">All registered actions available for preview mode</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-800/40 to-blue-900/40 rounded-lg border border-blue-500/30 p-6">
            <div className="text-blue-300 text-sm font-medium mb-2">Status</div>
            <div className="text-2xl font-bold text-blue-100">{registry.status}</div>
          </div>
          <div className="bg-gradient-to-br from-indigo-800/40 to-indigo-900/40 rounded-lg border border-indigo-500/30 p-6">
            <div className="text-indigo-300 text-sm font-medium mb-2">Version</div>
            <div className="text-2xl font-bold text-indigo-100">{registry.version}</div>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8 mb-12">
          <h2 className="text-xl font-bold text-white mb-6">Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Total Actions</div>
              <div className="text-3xl font-bold text-cyan-300">{registry.metrics.actionCount}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Available</div>
              <div className="text-3xl font-bold text-green-300">{registry.metrics.approvedActionTypes}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Blocked</div>
              <div className="text-3xl font-bold text-red-300">{registry.metrics.blockedActionTypes}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Approval Required</div>
              <div className="text-3xl font-bold text-amber-300">{registry.metrics.approvalRequiredCount}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Safety Score</div>
              <div className="text-3xl font-bold text-orange-300">{registry.metrics.safetyScore}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Health Score</div>
              <div className="text-3xl font-bold text-lime-300">{registry.metrics.healthScore}</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8">
          <h2 className="text-xl font-bold text-white mb-6">Registered Actions ({registry.actions.length})</h2>
          <div className="space-y-3">
            {registry.actions.map((action) => (
              <div key={action.id} className="bg-slate-700/40 hover:bg-slate-700/60 transition rounded-lg p-4 border border-slate-600/50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-white">{action.name}</h3>
                    <p className="text-slate-400 text-sm">{action.description}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-1 ${
                      action.safetyLevel === 'critical' ? 'bg-red-500/30 text-red-200' :
                      action.safetyLevel === 'high' ? 'bg-orange-500/30 text-orange-200' :
                      action.safetyLevel === 'medium' ? 'bg-amber-500/30 text-amber-200' :
                      'bg-green-500/30 text-green-200'
                    }`}>
                      {action.safetyLevel}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap text-xs">
                  <span className="bg-slate-600/50 text-slate-200 px-2 py-1 rounded font-mono">{action.actionType}</span>
                  <span className={`px-2 py-1 rounded ${
                    action.status === 'available' ? 'bg-green-600/50 text-green-200' :
                    action.status === 'blocked' ? 'bg-red-600/50 text-red-200' :
                    'bg-gray-600/50 text-gray-200'
                  }`}>
                    {action.status}
                  </span>
                  {action.requiresApproval && <span className="bg-blue-600/50 text-blue-200 px-2 py-1 rounded">Requires Approval</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
