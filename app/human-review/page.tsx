import { getHumanReviewReader } from '../../lib/gamma/human-review-reader'

export const dynamic = 'force-dynamic'

export default async function HumanReviewPage() {
  const review = await getHumanReviewReader()
  const pending = review.reviews.filter(r => r.reviewStatus === 'pending').length
  const inProgress = review.reviews.filter(r => r.reviewStatus === 'in_progress').length
  const approved = review.reviews.filter(r => r.reviewStatus === 'approved').length
  const rejected = review.reviews.filter(r => r.reviewStatus === 'rejected').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Human Review Center</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-slate-700/50 rounded p-4"><div className="text-xs text-slate-400 mb-1">Total</div><div className="text-3xl font-bold text-cyan-300">{review.metrics.reviewItemCount}</div></div>
          <div className="bg-slate-700/50 rounded p-4"><div className="text-xs text-slate-400 mb-1">Pending</div><div className="text-3xl font-bold text-amber-300">{pending}</div></div>
          <div className="bg-slate-700/50 rounded p-4"><div className="text-xs text-slate-400 mb-1">In Progress</div><div className="text-3xl font-bold text-blue-300">{inProgress}</div></div>
          <div className="bg-slate-700/50 rounded p-4"><div className="text-xs text-slate-400 mb-1">Approved</div><div className="text-3xl font-bold text-green-300">{approved}</div></div>
          <div className="bg-slate-700/50 rounded p-4"><div className="text-xs text-slate-400 mb-1">Rejected</div><div className="text-3xl font-bold text-red-300">{rejected}</div></div>
          <div className="bg-slate-700/50 rounded p-4"><div className="text-xs text-slate-400 mb-1">Coverage</div><div className="text-3xl font-bold text-purple-300">{review.metrics.reviewCoverage}%</div></div>
        </div>
        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8">
          <h2 className="text-xl font-bold text-white mb-6">Review Queue</h2>
          <div className="space-y-2">
            {review.reviews.map(r => (
              <div key={r.id} className="bg-slate-700/40 rounded p-3 border border-slate-600/50 flex justify-between items-center">
                <div><p className="text-white font-medium">{r.action}</p><p className="text-xs text-slate-400">{r.assignedReviewer}</p></div>
                <div className="flex gap-2"><span className={`px-2 py-1 text-xs rounded ${r.priority === 'critical' ? 'bg-red-600/50 text-red-200' : r.priority === 'high' ? 'bg-orange-600/50 text-orange-200' : 'bg-slate-600/50 text-slate-200'}`}>{r.priority}</span><span className={`px-2 py-1 text-xs rounded ${r.reviewStatus === 'pending' ? 'bg-amber-600/50 text-amber-200' : r.reviewStatus === 'approved' ? 'bg-green-600/50 text-green-200' : 'bg-blue-600/50 text-blue-200'}`}>{r.reviewStatus}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
