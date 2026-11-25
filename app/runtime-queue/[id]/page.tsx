import { getRuntimeQueueReader } from '../../../lib/gamma/runtime-queue-reader'

export const dynamic = 'force-dynamic'

interface Params { id: string }

export default async function QueueItemPage({ params }: { params: Params }) {
  const queue = await getRuntimeQueueReader()
  const item = queue.items.find(i => i.id === params.id)
  if (!item) return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 p-8"><div className="max-w-4xl mx-auto"><h1 className="text-3xl font-bold text-white">Item Not Found</h1></div></div>
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">{item.title}</h1>
        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div><h3 className="text-sm text-slate-400 mb-2">ID</h3><p className="text-lg text-white font-mono">{item.id}</p></div>
            <div><h3 className="text-sm text-slate-400 mb-2">Status</h3><p className="text-lg text-white">{item.status}</p></div>
            <div><h3 className="text-sm text-slate-400 mb-2">Priority</h3><p className="text-lg text-white font-bold">{item.priority}</p></div>
            <div><h3 className="text-sm text-slate-400 mb-2">Est. Time</h3><p className="text-lg text-white">{item.estimatedTime}s</p></div>
          </div>
          {item.dependencies.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-sm text-slate-400 mb-3">Dependencies</h3>
              <div className="space-y-2">{item.dependencies.map(d => <div key={d} className="bg-slate-700/40 p-2 rounded text-sm text-slate-200">{d}</div>)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
