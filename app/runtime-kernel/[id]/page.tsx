import { getRuntimeKernelRegistry } from '../../../lib/gamma/runtime-kernel-reader'

export const dynamic = 'force-dynamic'

interface Params {
  id: string
}

export default async function RuntimeKernelDetailPage({ params }: { params: Params }) {
  const registry = await getRuntimeKernelRegistry()
  const unit = registry.runtimeUnits.find((u) => u.id === params.id)

  if (!unit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white">Runtime Unit Not Found</h1>
          <p className="text-slate-400 mt-2">Unit ID: {params.id}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{unit.name}</h1>
          <p className="text-purple-300">Runtime unit details and execution preview</p>
        </div>

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Unit ID</h3>
              <p className="text-lg text-white font-mono">{unit.id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Type</h3>
              <p className="text-lg text-white">{unit.type}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Status</h3>
              <p className="text-lg text-white">{unit.status}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Execution Mode</h3>
              <p className="text-lg text-white">{unit.executionMode}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Safety Level</h3>
              <p className={`text-lg font-semibold ${
                unit.safetyLevel === 'critical' ? 'text-red-300' :
                unit.safetyLevel === 'high' ? 'text-orange-300' :
                unit.safetyLevel === 'medium' ? 'text-amber-300' :
                'text-green-300'
              }`}>
                {unit.safetyLevel}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Approval Required</h3>
              <p className="text-lg text-white">{unit.requiresApproval ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8">
          <h2 className="text-xl font-bold text-white mb-4">Execution Preview</h2>
          <div className="bg-slate-900/60 rounded p-4 border border-slate-700 mb-4">
            <p className="text-slate-300 text-sm mb-4">This is a PREVIEW ONLY. No actual execution will occur.</p>
            <div className="space-y-2 text-slate-400 font-mono text-xs">
              <p>➤ Unit: {unit.name}</p>
              <p>➤ Mode: {unit.executionMode}</p>
              <p>➤ Safety: {unit.safetyLevel}</p>
              {unit.requiresApproval && <p className="text-blue-300">➤ Requires: Human Approval</p>}
              <p>➤ Status: {unit.status}</p>
            </div>
          </div>

          <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4 mb-4">
            <p className="text-amber-200 text-sm">
              ⚠️ This action requires explicit human approval before execution can be initiated.
            </p>
          </div>

          <button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-medium transition">
            Request Approval Preview
          </button>
        </div>
      </div>
    </div>
  )
}
