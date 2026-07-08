import { getExecutionSimulatorReader } from '../../lib/gamma/execution-simulator-reader'

export const dynamic = 'force-dynamic'

export default async function ExecutionSimulatorPage() {
  const sim = await getExecutionSimulatorReader()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Execution Simulator</h1>
        
        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Simulation Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Total Simulations</div>
              <div className="text-3xl font-bold text-cyan-300">{sim.metrics.simulationCount}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Success Projection</div>
              <div className="text-3xl font-bold text-green-300">{sim.metrics.successProjection}%</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Failure Projection</div>
              <div className="text-3xl font-bold text-red-300">{sim.metrics.failureProjection}%</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Risk Projection</div>
              <div className="text-3xl font-bold text-amber-300">{sim.metrics.riskProjection}%</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Manual Review</div>
              <div className="text-3xl font-bold text-purple-300">{sim.metrics.manualReviewRequired}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Confidence</div>
              <div className="text-3xl font-bold text-indigo-300">{sim.metrics.simulationConfidence}%</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4 md:col-span-2">
              <div className="text-slate-400 text-xs font-medium mb-1">Health Score</div>
              <div className="text-3xl font-bold text-lime-300">{sim.metrics.healthScore}</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8">
          <h2 className="text-xl font-bold text-white mb-6">Simulation Results</h2>
          <div className="space-y-3">
            {sim.results.map((result) => (
              <div key={result.id} className="bg-slate-700/40 rounded p-4 border border-slate-600/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono text-sm text-slate-200">{result.id}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-xs bg-green-600/50 text-green-200 px-2 py-1 rounded">Success: {result.successProjection}%</span>
                      <span className="text-xs bg-red-600/50 text-red-200 px-2 py-1 rounded">Failure: {result.failureProjection}%</span>
                      <span className="text-xs bg-amber-600/50 text-amber-200 px-2 py-1 rounded">Risk: {result.riskProjection}%</span>
                      {result.manualReviewRequired && <span className="text-xs bg-blue-600/50 text-blue-200 px-2 py-1 rounded">Requires Review</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-300">Confidence: {result.confidence}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
