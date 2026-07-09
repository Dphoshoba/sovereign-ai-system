import Link from 'next/link';
import { GmailComplianceReader } from '../../lib/gamma/gmail-compliance-reader';

export default function GmailCompliancePage() {
  const reader = new GmailComplianceReader();

  // Deterministic correlation IDs for UI demo.
  const correlations = ['exec_alpha', 'exec_beta', 'exec_gamma'];

  const items = correlations.map(id => {
    const report = reader.getReportById(id);
    return {
      id: report.correlationId,
      complianceScore: report.metrics.complianceScore,
      integrityScore: report.metrics.integrityScore,
      auditCoverage: report.metrics.auditCoverage,
      healthScore: report.metrics.healthScore,
      exportReadyCount: report.metrics.exportReadyCount,
      riskFlagCount: report.metrics.riskFlagCount,
    };
  });

  const averageHealth =
    items.reduce((sum, i) => sum + i.healthScore, 0) / (items.length || 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Gmail Compliance Audit</h1>
          <p className="text-lg text-slate-600">
            Governance projection for OAuth → message read → draft → preview → approval → queue → execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="text-sm font-medium text-slate-600">Average Health Score</div>
            <div className="text-3xl font-bold text-green-700 mt-2">{Math.round(averageHealth)}</div>
            <div className="text-xs text-slate-500 mt-1">0-100</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="text-sm font-medium text-slate-600">Total Export-Ready</div>
            <div className="text-3xl font-bold text-blue-700 mt-2">
              {items.reduce((s, i) => s + i.exportReadyCount, 0)}
            </div>
            <div className="text-xs text-slate-500 mt-1">reports</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="text-sm font-medium text-slate-600">Total Risk Flags</div>
            <div className="text-3xl font-bold text-red-700 mt-2">
              {items.reduce((s, i) => s + i.riskFlagCount, 0)}
            </div>
            <div className="text-xs text-slate-500 mt-1">integrity/compliance warnings</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Compliance Reports</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Correlation</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Compliance</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Integrity</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Coverage</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Health</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Export</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Risk</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-600">{item.id}</td>
                    <td className="py-3 px-4 font-semibold text-blue-700">{item.complianceScore}</td>
                    <td className="py-3 px-4 font-semibold text-purple-700">{item.integrityScore}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.auditCoverage}%</td>
                    <td className="py-3 px-4 font-semibold text-green-700">{item.healthScore}</td>
                    <td className="py-3 px-4">{item.exportReadyCount}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          item.riskFlagCount > 0
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-green-50 text-green-700 border border-green-200'
                        }`}
                      >
                        {item.riskFlagCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-slate-600">Open a report to view its compliance event timeline and integrity findings.</div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map(item => (
            <Link
              key={item.id}
              href={`/gmail-compliance/${item.id}`}
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 hover:bg-slate-50 transition"
            >
              <div className="text-xs text-slate-500">Report</div>
              <div className="font-mono font-semibold text-slate-800">{item.id}</div>
              <div className="mt-2 text-sm text-slate-600">Coverage: {item.auditCoverage}%</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

