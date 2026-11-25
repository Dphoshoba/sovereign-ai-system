import { getRuntimeAuditReader } from '../../lib/gamma/runtime-audit-reader'

export const dynamic = 'force-dynamic'

export default async function RuntimeAuditPage() {
  const audit = await getRuntimeAuditReader()

  const eventCounts = {
    proposed: audit.events.filter(e => e.eventType === 'action_proposed').length,
    approved: audit.events.filter(e => e.eventType === 'action_approved').length,
    blocked: audit.events.filter(e => e.eventType === 'action_blocked').length,
    executed: audit.events.filter(e => e.eventType === 'action_executed').length,
    risk: audit.events.filter(e => e.eventType === 'risk_detected').length,
    reviewed: audit.events.filter(e => e.eventType === 'review_completed').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Runtime Audit Log</h1>
          <p className="text-purple-300">Deterministic audit trail for all runtime operations</p>
        </div>

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8 mb-12">
          <h2 className="text-xl font-bold text-white mb-6">Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-700/50 rounded p-3">
              <div className="text-slate-400 text-xs font-medium mb-1">Total Events</div>
              <div className="text-2xl font-bold text-cyan-300">{audit.metrics.auditEventCount}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-3">
              <div className="text-slate-400 text-xs font-medium mb-1">Trace Coverage</div>
              <div className="text-2xl font-bold text-green-300">{audit.metrics.traceCoverage}%</div>
            </div>
            <div className="bg-slate-700/50 rounded p-3">
              <div className="text-slate-400 text-xs font-medium mb-1">Risk Flags</div>
              <div className="text-2xl font-bold text-red-300">{audit.metrics.riskFlagCount}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-3">
              <div className="text-slate-400 text-xs font-medium mb-1">Reviews</div>
              <div className="text-2xl font-bold text-purple-300">{audit.metrics.operatorReviewCount}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-3">
              <div className="text-slate-400 text-xs font-medium mb-1">Audit Score</div>
              <div className="text-2xl font-bold text-indigo-300">{audit.metrics.auditIntegrityScore}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-3">
              <div className="text-slate-400 text-xs font-medium mb-1">Health</div>
              <div className="text-2xl font-bold text-lime-300">{audit.metrics.healthScore}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {Object.entries(eventCounts).map(([type, count]) => (
            <div key={type} className="bg-slate-700/40 rounded p-4 border border-slate-600/50">
              <div className="text-slate-400 text-xs uppercase font-medium">{type}</div>
              <div className="text-3xl font-bold text-white mt-2">{count}</div>
            </div>
          ))}
        </div>

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8">
          <h2 className="text-xl font-bold text-white mb-6">Recent Events ({audit.events.length})</h2>
          <div className="space-y-2">
            {audit.events.map((event) => (
              <div key={event.id} className="bg-slate-700/40 hover:bg-slate-700/60 transition rounded p-3 border border-slate-600/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-mono text-xs text-slate-400 mb-1">{event.eventType}</p>
                    <p className="text-slate-200 text-sm">{event.description}</p>
                    <p className="text-xs text-slate-500 mt-1">Operator: {event.operator}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      event.riskLevel === 'critical' ? 'bg-red-500/30 text-red-200' :
                      event.riskLevel === 'high' ? 'bg-orange-500/30 text-orange-200' :
                      event.riskLevel === 'medium' ? 'bg-amber-500/30 text-amber-200' :
                      'bg-green-500/30 text-green-200'
                    }`}>
                      {event.riskLevel}
                    </div>
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
