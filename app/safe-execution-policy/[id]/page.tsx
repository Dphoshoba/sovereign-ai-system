import { getSafeExecutionPolicyReader } from '../../../lib/gamma/safe-execution-policy-reader'

export const dynamic = 'force-dynamic'

interface Params { id: string }

export default async function PolicyDetailPage({ params }: { params: Params }) {
  const policy = await getSafeExecutionPolicyReader()
  const p = policy.policies.find(x => x.rule === params.id)
  if (!p) return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 p-8"><div className="max-w-4xl mx-auto"><h1 className="text-3xl font-bold text-white">Policy Not Found</h1></div></div>
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">{p.rule}</h1>
        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div><h3 className="text-sm text-slate-400 mb-2">Status</h3><p className="text-lg text-white">{p.status}</p></div>
            <div><h3 className="text-sm text-slate-400 mb-2">Violations</h3><p className="text-lg text-white font-bold">{p.violations}</p></div>
          </div>
          <div><h3 className="text-sm text-slate-400 mb-2">Description</h3><p className="text-white">{p.description}</p></div>
        </div>
      </div>
    </div>
  )
}
