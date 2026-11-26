import { getApprovalWorkflowReader } from '../../lib/gamma/approval-workflow-reader'

export const dynamic = 'force-dynamic'

export default async function ApprovalWorkflowPage() {
  const workflow = await getApprovalWorkflowReader()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Approval Workflow</h1>
          <p className="text-green-300">Deterministic approval preview pipeline</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <div className="bg-gradient-to-br from-green-800/40 to-green-900/40 rounded-lg border border-green-500/30 p-6">
            <div className="text-green-300 text-sm font-medium mb-2">Status</div>
            <div className="text-2xl font-bold text-green-100">{workflow.status}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-800/40 to-emerald-900/40 rounded-lg border border-emerald-500/30 p-6">
            <div className="text-emerald-300 text-sm font-medium mb-2">Version</div>
            <div className="text-2xl font-bold text-emerald-100">{workflow.version}</div>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8 mb-12">
          <h2 className="text-xl font-bold text-white mb-6">Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Queue Count</div>
              <div className="text-3xl font-bold text-cyan-300">{workflow.metrics.approvalQueueCount}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Pending</div>
              <div className="text-3xl font-bold text-amber-300">{workflow.metrics.pendingCount}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Approved</div>
              <div className="text-3xl font-bold text-green-300">{workflow.metrics.approvedPreviewCount}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Blocked</div>
              <div className="text-3xl font-bold text-red-300">{workflow.metrics.blockedCount}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Rejected</div>
              <div className="text-3xl font-bold text-orange-300">{workflow.metrics.rejectedCount}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-slate-400 text-xs font-medium mb-1">Review Coverage</div>
              <div className="text-3xl font-bold text-purple-300">{workflow.metrics.humanReviewCoverage}%</div>
            </div>
            <div className="bg-slate-700/50 rounded p-4 md:col-span-2">
              <div className="text-slate-400 text-xs font-medium mb-1">Health Score</div>
              <div className="text-3xl font-bold text-lime-300">{workflow.metrics.healthScore}</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8">
          <h2 className="text-xl font-bold text-white mb-6">Pending Approvals ({workflow.metrics.pendingCount})</h2>
          <div className="space-y-3">
            {workflow.approvals.map((approval) => (
              <div key={approval.id} className="bg-slate-700/40 hover:bg-slate-700/60 transition rounded-lg p-4 border border-slate-600/50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-white">{approval.title}</h3>
                    <p className="text-slate-400 text-sm">{approval.description}</p>
                  </div>
                  <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    approval.state === 'pending_review' ? 'bg-amber-500/30 text-amber-200' :
                    approval.state === 'approved_preview' ? 'bg-green-500/30 text-green-200' :
                    approval.state === 'blocked' ? 'bg-red-500/30 text-red-200' :
                    approval.state === 'rejected' ? 'bg-orange-500/30 text-orange-200' :
                    'bg-slate-500/30 text-slate-200'
                  }`}>
                    {approval.state.replace(/_/g, ' ')}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap text-xs">
                  <span className="bg-slate-600/50 text-slate-200 px-2 py-1 rounded">{approval.completedApprovals}/{approval.requiredApprovals} approved</span>
                  {approval.riskLevel !== 'low' && (
                    <span className={`${approval.riskLevel === 'critical' ? 'bg-red-600/50 text-red-200' : approval.riskLevel === 'high' ? 'bg-orange-600/50 text-orange-200' : 'bg-amber-600/50 text-amber-200'} px-2 py-1 rounded`}>
                      {approval.riskLevel} risk
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
