import { getRuntimeAuditReader } from '../../../lib/gamma/runtime-audit-reader'

export const dynamic = 'force-dynamic'

interface Params {
  id: string
}

export default async function AuditEventPage({ params }: { params: Params }) {
  const audit = await getRuntimeAuditReader()
  const event = audit.events.find((e) => e.id === params.id)

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white">Event Not Found</h1>
          <p className="text-slate-400 mt-2">Event ID: {params.id}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Audit Event</h1>
          <p className="text-purple-300">{event.description}</p>
        </div>

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Event ID</h3>
              <p className="text-lg text-white font-mono">{event.id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Event Type</h3>
              <p className="text-lg text-white">{event.eventType}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Operator</h3>
              <p className="text-lg text-white">{event.operator}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Risk Level</h3>
              <p className={`text-lg font-semibold ${
                event.riskLevel === 'critical' ? 'text-red-300' :
                event.riskLevel === 'high' ? 'text-orange-300' :
                event.riskLevel === 'medium' ? 'text-amber-300' :
                'text-green-300'
              }`}>
                {event.riskLevel}
              </p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Traceable</h3>
              <p className="text-lg text-white">{event.traceable ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        {event.relatedActions.length > 0 && (
          <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Related Actions</h2>
            <div className="space-y-2">
              {event.relatedActions.map((action, idx) => (
                <div key={idx} className="bg-slate-700/40 rounded p-3 border border-slate-600/50">
                  <p className="font-mono text-sm text-slate-200">{action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8">
          <h2 className="text-xl font-bold text-white mb-4">Event Details</h2>
          <div className="bg-slate-900/60 rounded p-4 border border-slate-700">
            <div className="font-mono text-sm text-slate-300 space-y-1">
              <p>Event: {event.eventType}</p>
              <p>Description: {event.description}</p>
              <p>Risk: {event.riskLevel}</p>
              <p>Traceable: {event.traceable ? 'true' : 'false'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
