import { getActionRegistryReader } from '../../../lib/gamma/action-registry-reader'

export const dynamic = 'force-dynamic'

interface Params {
  id: string
}

export default async function ActionDetailPage({ params }: { params: Params }) {
  const registry = await getActionRegistryReader()
  const action = registry.actions.find((a) => a.id === params.id)

  if (!action) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white">Action Not Found</h1>
          <p className="text-slate-400 mt-2">Action ID: {params.id}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{action.name}</h1>
          <p className="text-blue-300">{action.description}</p>
        </div>

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Action ID</h3>
              <p className="text-lg text-white font-mono">{action.id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Action Type</h3>
              <p className="text-lg text-white font-mono">{action.actionType}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Status</h3>
              <p className={`text-lg font-semibold ${
                action.status === 'available' ? 'text-green-300' :
                action.status === 'blocked' ? 'text-red-300' :
                'text-gray-300'
              }`}>
                {action.status}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Safety Level</h3>
              <p className={`text-lg font-semibold ${
                action.safetyLevel === 'critical' ? 'text-red-300' :
                action.safetyLevel === 'high' ? 'text-orange-300' :
                action.safetyLevel === 'medium' ? 'text-amber-300' :
                'text-green-300'
              }`}>
                {action.safetyLevel}
              </p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Approval Required</h3>
              <p className="text-lg text-white">{action.requiresApproval ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Action Preview</h2>
          <div className="bg-slate-900/60 rounded p-4 border border-slate-700 mb-4">
            <p className="text-slate-300 text-sm mb-4">This is a PREVIEW ONLY. No actual action will occur.</p>
            <div className="space-y-2 text-slate-400 font-mono text-xs">
              <p>➤ Name: {action.name}</p>
              <p>➤ Type: {action.actionType}</p>
              <p>➤ Safety: {action.safetyLevel}</p>
              <p>➤ Status: {action.status}</p>
              {action.requiresApproval && <p className="text-blue-300">➤ Human Approval: Required</p>}
            </div>
          </div>

          {action.requiresApproval && (
            <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4">
              <p className="text-amber-200 text-sm">
                ⚠️ This action requires explicit human approval before execution can be initiated.
              </p>
            </div>
          )}
        </div>

        <button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-medium transition">
          Preview Execution
        </button>
      </div>
    </div>
  )
}
