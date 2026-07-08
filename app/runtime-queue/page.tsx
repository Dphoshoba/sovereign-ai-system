import { getRuntimeQueueReader } from '../../lib/gamma/runtime-queue-reader'

export const dynamic = 'force-dynamic'

export default async function RuntimeQueuePage() {
  const queue = await getRuntimeQueueReader()
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Runtime Queue</h1>
        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Queue Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-slate-700/50 rounded p-3"><div className="text-xs text-slate-400 mb-1">Total</div><div className="text-2xl font-bold text-cyan-300">{queue.metrics.queueCount}</div></div>
            <div className="bg-slate-700/50 rounded p-3"><div className="text-xs text-slate-400 mb-1">Ready</div><div className="text-2xl font-bold text-green-300">{queue.metrics.readyCount}</div></div>
            <div className="bg-slate-700/50 rounded p-3"><div className="text-xs text-slate-400 mb-1">Blocked</div><div className="text-2xl font-bold text-red-300">{queue.metrics.blockedCount}</div></div>
            <div className="bg-slate-700/50 rounded p-3"><div className="text-xs text-slate-400 mb-1">Waiting</div><div className="text-2xl font-bold text-amber-300">{queue.metrics.waitingForApprovalCount}</div></div>
            <div className="bg-slate-700/50 rounded p-3"><div className="text-xs text-slate-400 mb-1">Deps</div><div className="text-2xl font-bold text-purple-300">{queue.metrics.dependencyCount}</div></div>
            <div className="bg-slate-700/50 rounded p-3"><div className="text-xs text-slate-400 mb-1">Q Health</div><div className="text-2xl font-bold text-indigo-300">{queue.metrics.queueHealth}</div></div>
            <div className="bg-slate-700/50 rounded p-3"><div className="text-xs text-slate-400 mb-1">Health</div><div className="text-2xl font-bold text-lime-300">{queue.metrics.healthScore}</div></div>
          </div>
        </div>
        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8">
          <h2 className="text-xl font-bold text-white mb-6">Queued Items</h2>
          <div className="space-y-2">
            {queue.items.map(item => (
              <div key={item.id} className="bg-slate-700/40 rounded p-3 border border-slate-600/50">
                <div className="flex justify-between items-start">
                  <div><p className="font-mono text-sm text-slate-200">{item.title}</p></div>
                  <div className="flex gap-1"><span className={`px-2 py-1 text-xs rounded ${item.status === 'ready' ? 'bg-green-600/50 text-green-200' : item.status === 'blocked' ? 'bg-red-600/50 text-red-200' : 'bg-amber-600/50 text-amber-200'}`}>{item.status}</span><span className="bg-slate-600/50 text-slate-200 px-2 py-1 text-xs rounded">P{item.priority}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
