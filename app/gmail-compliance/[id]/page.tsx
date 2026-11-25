import { GmailComplianceReader } from '../../../lib/gamma/gmail-compliance-reader';

export default function GmailComplianceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const reader = new GmailComplianceReader();

  const report = reader.getReportById(params.id);
  const { metrics, integrity, events, coverageByEventType } = report;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <a
          href="/gmail-compliance"
          className="text-blue-600 hover:text-blue-800 font-medium mb-6 inline-block"
        >
          ← Back to Gmail Compliance
        </a>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Compliance Report</h1>
              <p className="text-slate-600 mt-1">Correlation: {report.correlationId}</p>
            </div>
            <div
              className={`px-4 py-2 rounded-lg font-semibold text-sm border ${
                metrics.complianceScore >= 90
                  ? 'bg-green-50 text-green-800 border-green-200'
                  : metrics.complianceScore >= 70
                    ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                    : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              Compliance: {metrics.complianceScore}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded p-4">
              <div className="text-xs text-slate-500">Health Score</div>
              <div className="text-2xl font-bold text-green-700 mt-1">{metrics.healthScore}</div>
            </div>
            <div className="bg-slate-50 rounded p-4">
              <div className="text-xs text-slate-500">Integrity Score</div>
              <div className="text-2xl font-bold text-purple-700 mt-1">{metrics.integrityScore}</div>
            </div>
            <div className="bg-slate-50 rounded p-4">
              <div className="text-xs text-slate-500">Audit Coverage</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{metrics.auditCoverage}%</div>
            </div>
            <div className="bg-slate-50 rounded p-4">
              <div className="text-xs text-slate-500">Risk Flags</div>
              <div className="text-2xl font-bold text-red-700 mt-1">{metrics.riskFlagCount}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Integrity Findings</h2>
          {integrity.valid ? (
            <div className="text-green-800 bg-green-50 border border-green-200 rounded p-4 text-sm">
              ✓ Integrity valid (append-only + chronological + details safety checks)
            </div>
          ) : (
            <div className="text-red-800 bg-red-50 border border-red-200 rounded p-4 text-sm">
              ✗ Integrity invalid
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {integrity.issues.map((i: string) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Required Coverage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(coverageByEventType).map(([eventType, ok]) => (
              <div
                key={eventType}
                className={`flex items-center justify-between rounded border p-3 text-sm ${
                  ok
                    ? 'bg-green-50 border-green-200 text-green-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <span className="font-mono">{eventType}</span>
                <span className="font-semibold">{ok ? '✓' : '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Compliance Event Timeline</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Event</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Operator</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Details</th>
                </tr>
              </thead>
              <tbody>
                {events.map(e => (
                  <tr key={e.id} className="border-b border-slate-100">
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {e.timestamp.toISOString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800">{e.eventType}</td>
                    <td className="py-3 px-4">{e.category}</td>
                    <td className="py-3 px-4 text-slate-600">{e.operator}</td>
                    <td className="py-3 px-4">
                      <pre className="text-xs whitespace-pre-wrap break-words bg-slate-50 p-3 rounded border border-slate-200">
                        {JSON.stringify(e.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

