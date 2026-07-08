import { getExecutionSimulatorReader } from '../../../lib/gamma/execution-simulator-reader'

export const dynamic = 'force-dynamic'

interface Params { id: string }

export default async function SimulationDetailPage({ params }: { params: Params }) {
  const sim = await getExecutionSimulatorReader()
  const result = sim.results.find((r) => r.id === params.id)

  if (!result) return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-8"><div className="max-w-4xl mx-auto"><h1 className="text-3xl font-bold text-white">Simulation Not Found</h1></div></div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Simulation Result: {result.id}</h1>
        
        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div><h3 className="text-sm text-slate-400 mb-2">Action ID</h3><p className="text-lg text-white font-mono">{result.actionId}</p></div>
            <div><h3 className="text-sm text-slate-400 mb-2">Confidence</h3><p className="text-lg text-indigo-300 font-bold">{result.confidence}%</p></div>
            <div><h3 className="text-sm text-slate-400 mb-2">Success Projection</h3><p className="text-lg text-green-300 font-bold">{result.successProjection}%</p></div>
            <div><h3 className="text-sm text-slate-400 mb-2">Risk Projection</h3><p className="text-lg text-amber-300 font-bold">{result.riskProjection}%</p></div>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8">
          <h2 className="text-xl font-bold text-white mb-4">Assumptions</h2>
          <div className="space-y-2">{result.assumptions.map((a, i) => <div key={i} className="bg-slate-700/40 p-3 rounded border border-slate-600/50"><p className="text-slate-200 text-sm">✓ {a}</p></div>)}</div>
        </div>
      </div>
    </div>
  )
}
