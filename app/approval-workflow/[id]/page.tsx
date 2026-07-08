import { getApprovalWorkflowReader } from '../../../lib/gamma/approval-workflow-reader'

export const dynamic = 'force-dynamic'

interface Params {
  id: string
}

export default async function ApprovalDetailPage({ params }: { params: Params }) {
  const workflow = await getApprovalWorkflowReader()
  const approval = workflow.approvals.find((a) => a.id === params.id)

  if (!approval) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white">Approval Not Found</h1>
          <p className="text-slate-400 mt-2">Approval ID: {params.id}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{approval.title}</h1>
          <p className="text-green-300">{approval.description}</p>
        </div>

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Approval ID</h3>
              <p className="text-lg text-white font-mono">{approval.id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Current State</h3>
              <p className={`text-lg font-semibold ${
                approval.state === 'pending_review' ? 'text-amber-300' :
                approval.state === 'approved_preview' ? 'text-green-300' :
                approval.state === 'blocked' ? 'text-red-300' :
                'text-gray-300'
              }`}>
                {approval.state.replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Risk Level</h3>
              <p className={`text-lg font-semibold ${
                approval.riskLevel === 'critical' ? 'text-red-300' :
                approval.riskLevel === 'high' ? 'text-orange-300' :
                approval.riskLevel === 'medium' ? 'text-amber-300' :
                'text-green-300'
              }`}>
                {approval.riskLevel}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Approvals</h3>
              <p className="text-lg text-white">{approval.completedApprovals} of {approval.requiredApprovals}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Reviewers</h2>
          <div className="space-y-2">
            {approval.reviewers.map((reviewer, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-slate-200">{reviewer}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8">
          <h2 className="text-xl font-bold text-white mb-4">Approval Preview</h2>
          <div className="bg-slate-900/60 rounded p-4 border border-slate-700 mb-4">
            <p className="text-slate-300 text-sm mb-4">This is a PREVIEW ONLY. No action will occur.</p>
            <div className="space-y-2 text-slate-400 font-mono text-xs">
              <p>➤ Title: {approval.title}</p>
              <p>➤ State: {approval.state}</p>
              <p>➤ Risk: {approval.riskLevel}</p>
              <p>➤ Progress: {approval.completedApprovals}/{approval.requiredApprovals} approvals</p>
              <p className="text-green-300">➤ Reviewers: {approval.reviewers.length}</p>
            </div>
          </div>

          <button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-medium transition">
            Request Review
          </button>
        </div>
      </div>
    </div>
  )
}
