'use client';

import { useState, useEffect } from 'react';

interface PlatformMetrics {
  engineeringScore: number;
  maintainabilityScore: number;
  performanceScore: number;
  securityScore: number;
  testCount: number;
  testTarget: number;
  readerCount: number;
  connectorFiles: number;
  platformFiles: number;
  certificationScore: number;
  referenceReadiness: number;
  estimatedBuildReduction: number;
  buildStatus: 'passing' | 'failing' | 'unknown';
  lastAuditDate: string;
}

const MOCK_METRICS: PlatformMetrics = {
  engineeringScore: 68,
  maintainabilityScore: 72,
  performanceScore: 75,
  securityScore: 90,
  testCount: 397,
  testTarget: 500,
  readerCount: 131,
  connectorFiles: 45,
  platformFiles: 6,
  certificationScore: 93,
  referenceReadiness: 92,
  estimatedBuildReduction: 70,
  buildStatus: 'passing',
  lastAuditDate: '2026-07-10T12:00:00Z',
};

function ScoreCard({
  label,
  score,
  target = 100,
  unit = '/100',
}: {
  label: string;
  score: number;
  target?: number;
  unit?: string;
}) {
  const pct = Math.min(100, Math.round((score / target) * 100));
  const color = pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-red-500';
  const textColor = pct >= 90 ? 'text-green-700' : pct >= 70 ? 'text-yellow-700' : 'text-red-700';

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="text-sm font-medium text-slate-600 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${textColor}`}>
        {score}
        <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="text-sm font-medium text-slate-600">{label}</div>
      <div className="text-3xl font-bold text-slate-900 mt-1">{value}</div>
      {sub && <div className="text-sm text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function PlatformEngineeringDashboard() {
  const [metrics, setMetrics] = useState<PlatformMetrics>(MOCK_METRICS);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Platform Engineering</h1>
              <p className="text-slate-600 mt-1">Gamma Connector Platform v1.0 — Phase XVI.A</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  metrics.buildStatus === 'passing'
                    ? 'bg-green-100 text-green-700'
                    : metrics.buildStatus === 'failing'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                Build: {metrics.buildStatus}
              </span>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-2">
            Last audit: {new Date(metrics.lastAuditDate).toLocaleString()}
          </p>
        </div>

        {/* Engineering Scores */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Engineering Scores</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ScoreCard label="Engineering Score" score={metrics.engineeringScore} />
            <ScoreCard label="Maintainability" score={metrics.maintainabilityScore} />
            <ScoreCard label="Performance" score={metrics.performanceScore} />
            <ScoreCard label="Security" score={metrics.securityScore} />
          </div>
        </div>

        {/* Platform Metrics */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Platform Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Tests"
              value={metrics.testCount}
              sub={`Target: ${metrics.testTarget}`}
            />
            <StatCard label="GAMMA Readers" value={metrics.readerCount} sub="131 readers" />
            <StatCard label="Connector Files" value={metrics.connectorFiles} sub="Gmail reference" />
            <StatCard label="Platform SDK Files" value={metrics.platformFiles} sub="v1.0" />
          </div>
        </div>

        {/* Certification & Reuse */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Certification & Reuse</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScoreCard label="Gmail Certification" score={metrics.certificationScore} />
            <ScoreCard label="Reference Readiness" score={metrics.referenceReadiness} />
            <ScoreCard
              label="Future Connector Reduction"
              score={metrics.estimatedBuildReduction}
              unit="%"
            />
          </div>
        </div>

        {/* Technical Debt */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Technical Debt</h2>
          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
            {[
              {
                item: 'Reader boilerplate duplication',
                severity: 'high',
                lines: '4,000+',
                fix: 'GammaReaderBase (created)',
                status: 'fixed',
              },
              {
                item: 'API response duplication (521 routes)',
                severity: 'high',
                lines: '2,000+',
                fix: 'api-response-helpers.ts (created)',
                status: 'fixed',
              },
              {
                item: 'Health score color duplication',
                severity: 'medium',
                lines: '300',
                fix: 'health-helpers.ts (created)',
                status: 'fixed',
              },
              {
                item: 'Stub readers — 30 incomplete',
                severity: 'medium',
                lines: '600',
                fix: 'Implement or remove',
                status: 'open',
              },
              {
                item: 'Deep import chains (6 levels)',
                severity: 'medium',
                lines: 'all routes',
                fix: 'Add tsconfig path aliases',
                status: 'open',
              },
              {
                item: 'Duplicate token interfaces',
                severity: 'low',
                lines: '200',
                fix: 'Consolidate to platform SDK',
                status: 'open',
              },
            ].map((debt) => (
              <div key={debt.item} className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{debt.item}</div>
                  <div className="text-sm text-slate-500">
                    ~{debt.lines} lines affected · Fix: {debt.fix}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      debt.severity === 'high'
                        ? 'bg-red-100 text-red-700'
                        : debt.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {debt.severity}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      debt.status === 'fixed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {debt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Commands */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Platform Commands</h2>
          <div className="bg-slate-900 rounded-lg p-6 font-mono text-sm">
            {[
              ['npm run audit', 'Full platform audit report'],
              ['npm run platform:health', 'Quick health check'],
              ['npm run connector:validate -- --name=gmail', 'Validate connector'],
              [
                'npm run connector:scaffold -- --name=calendar --service="Google Calendar"',
                'Scaffold new connector',
              ],
              ['npm run test:determinism', 'Verify determinism'],
              ['npm run build', 'Production build'],
              ['npm test', 'All tests'],
            ].map(([cmd, desc]) => (
              <div key={cmd} className="flex items-start gap-4 mb-3">
                <span className="text-green-400 shrink-0">$</span>
                <div>
                  <div className="text-slate-100">{cmd}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase XVI Connector Roadmap */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Phase XVI Connector Roadmap</h2>
          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
            {[
              { name: 'Google Calendar', reuse: 78, weeks: '3–4', status: 'ready' },
              { name: 'Office 365', reuse: 80, weeks: '2–3', status: 'ready' },
              { name: 'Google Drive', reuse: 72, weeks: '3–4', status: 'ready' },
              { name: 'Slack', reuse: 68, weeks: '3–4', status: 'ready' },
              { name: 'GitHub', reuse: 65, weeks: '4–5', status: 'ready' },
              { name: 'Notion', reuse: 70, weeks: '3–4', status: 'ready' },
              { name: 'Discord', reuse: 75, weeks: '3–4', status: 'ready' },
            ].map((connector) => (
              <div key={connector.name} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium text-slate-900">{connector.name}</div>
                  <div className="text-sm text-slate-500">{connector.weeks} weeks · {connector.reuse}% code reuse</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-slate-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${connector.reuse}%` }}
                    />
                  </div>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">
                    {connector.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
