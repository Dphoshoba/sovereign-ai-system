import { getRuntimeAPIReader } from '../../lib/gamma/runtime-api-reader'

export const dynamic = 'force-dynamic'

export default async function RuntimeAPIPage() {
  const api = await getRuntimeAPIReader()
  const safe = api.endpoints.filter(e => e.safetyLevel === 'safe').length
  const restricted = api.endpoints.filter(e => e.safetyLevel === 'restricted').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Runtime API Preview</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-slate-700/50 rounded p-4"><div className="text-xs text-slate-400 mb-1">Endpoints</div><div className="text-3xl font-bold text-cyan-300">{api.metrics.runtimeEndpointCount}</div></div>
          <div className="bg-slate-700/50 rounded p-4"><div className="text-xs text-slate-400 mb-1">Preview</div><div className="text-3xl font-bold text-green-300">{api.metrics.previewEndpointCount}</div></div>
          <div className="bg-slate-700/50 rounded p-4"><div className="text-xs text-slate-400 mb-1">Safe</div><div className="text-3xl font-bold text-blue-300">{safe}</div></div>
          <div className="bg-slate-700/50 rounded p-4"><div className="text-xs text-slate-400 mb-1">Restricted</div><div className="text-3xl font-bold text-amber-300">{restricted}</div></div>
          <div className="bg-slate-700/50 rounded p-4"><div className="text-xs text-slate-400 mb-1">Safety</div><div className="text-3xl font-bold text-purple-300">{api.metrics.apiSafetyScore}</div></div>
          <div className="bg-slate-700/50 rounded p-4"><div className="text-xs text-slate-400 mb-1">Health</div><div className="text-3xl font-bold text-lime-300">{api.metrics.healthScore}</div></div>
        </div>
        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8">
          <h2 className="text-xl font-bold text-white mb-6">API Endpoints</h2>
          <div className="space-y-2">
            {api.endpoints.map(e => (
              <div key={e.id} className="bg-slate-700/40 rounded p-3 border border-slate-600/50 font-mono text-sm">
                <div className="flex justify-between items-start"><div><p className="text-white">{e.method} {e.path}</p><p className="text-xs text-slate-400 mt-1">{e.type}</p></div><div className="flex gap-2"><span className={`px-2 py-1 text-xs rounded ${e.safetyLevel === 'safe' ? 'bg-green-600/50 text-green-200' : 'bg-amber-600/50 text-amber-200'}`}>{e.safetyLevel}</span>{e.requiresApproval && <span className="bg-blue-600/50 text-blue-200 px-2 py-1 text-xs rounded">Approval</span>}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
