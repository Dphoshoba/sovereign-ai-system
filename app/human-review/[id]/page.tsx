import { getHumanReviewReader } from '../../../lib/gamma/human-review-reader'

export const dynamic = 'force-dynamic'

interface Params { id: string }

export default async function ReviewDetailPage({ params }: { params: Params }) {
  const review = await getHumanReviewReader()
  const item = review.reviews.find(r => r.id === params.id)
  if (!item) return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 p-8"><div className="max-w-4xl mx-auto"><h1 className="text-3xl font-bold text-white">Review Not Found</h1></div></div>
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">{item.action}</h1>
        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8">
          <div className="grid grid-cols-2 gap-4">
            <div><h3 className="text-sm text-slate-400 mb-2">ID</h3><p className="text-lg text-white font-mono">{item.id}</p></div>
            <div><h3 className="text-sm text-slate-400 mb-2">Status</h3><p className="text-lg text-white">{item.reviewStatus}</p></div>
            <div><h3 className="text-sm text-slate-400 mb-2">Priority</h3><p className="text-lg text-white font-bold">{item.priority}</p></div>
            <div><h3 className="text-sm text-slate-400 mb-2">Reviewer</h3><p className="text-lg text-white">{item.assignedReviewer}</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}
