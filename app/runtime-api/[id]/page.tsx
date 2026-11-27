import { getRuntimeAPIReader } from '../../../lib/gamma/runtime-api-reader'

export const dynamic = 'force-dynamic'

interface Params { id: string }

export default async function EndpointDetailPage({ params }: { params: Params }) {
  const api = await getRuntimeAPIReader()
  const ep = api.endpoints.find(e => e.id === params.id)
  if (!ep) return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 p-8"><div className="max-w-4xl mx-auto"><h1 className="text-3xl font-bold text-white">Endpoint Not Found</h1></div></div>
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 font-mono">{ep.method} {ep.path}</h1>
        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8">
          <div className="grid grid-cols-2 gap-4">
            <div><h3 className="text-sm text-slate-400 mb-2">Type</h3><p className="text-lg text-white">{ep.type}</p></div>
            <div><h3 className="text-sm text-slate-400 mb-2">Safety</h3><p className="text-lg text-white">{ep.safetyLevel}</p></div>
            <div><h3 className="text-sm text-slate-400 mb-2">Requires Approval</h3><p className="text-lg text-white">{ep.requiresApproval ? 'Yes' : 'No'}</p></div>
            <div><h3 className="text-sm text-slate-400 mb-2">Endpoint ID</h3><p className="text-lg text-white font-mono">{ep.id}</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}
