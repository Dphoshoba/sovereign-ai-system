'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { GmailHardeningAggregateHealth } from '../../../src/lib/gmail-hardening/types';

export default function GmailHardeningDetail() {
  const params = useParams();
  const id = params.id as string;
  const [health, setHealth] = useState<GmailHardeningAggregateHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const response = await fetch(`/api/connectors/gmail/hardening/snapshot/${id}`);
        if (response.ok) {
          const data = await response.json();
          setHealth(data);
        }
      } catch (error) {
        console.error('Failed to fetch health:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHealth();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Health Snapshot</h1>
          <p className="text-slate-600">Loading snapshot data...</p>
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Health Snapshot</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
            <p className="font-semibold">Snapshot not found</p>
            <p className="text-sm mt-2">Unable to load health snapshot {id}.</p>
          </div>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'high':
        return 'bg-orange-50 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a href="/gmail-hardening" className="text-blue-600 hover:text-blue-700 text-sm mb-4">
            ← Back to Dashboard
          </a>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Health Snapshot Details</h1>
          <p className="text-slate-600">
            Snapshot ID: <span className="font-mono text-sm">{id}</span>
          </p>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-slate-600 text-sm">Overall Health Score</span>
              <div className="text-3xl font-bold text-slate-900 mt-1">{health.overallHealth}/100</div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${
                    health.overallHealth >= 90
                      ? 'bg-green-500'
                      : health.overallHealth >= 70
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${health.overallHealth}%` }}
                />
              </div>
            </div>
            <div>
              <span className="text-slate-600 text-sm">Production Readiness</span>
              <div className="text-3xl font-bold text-slate-900 mt-1">
                {health.productionReadiness.score}/100
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${
                    health.productionReadiness.score >= 90
                      ? 'bg-green-500'
                      : health.productionReadiness.score >= 70
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${health.productionReadiness.score}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Health Sections */}
        <div className="space-y-6 mb-6">
          {/* Token Health */}
          <div className={`border rounded-lg p-6 ${getSeverityColor(health.tokenHealth.severity)}`}>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">OAuth Token Health</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-slate-600 text-sm">Score</span>
                <div className="text-2xl font-bold text-slate-900">{health.tokenHealth.score}/100</div>
              </div>
              <div>
                <span className="text-slate-600 text-sm">Connection Risk</span>
                <div className="text-2xl font-bold text-slate-900">{health.tokenHealth.connectionRisk}%</div>
              </div>
            </div>
            <div>
              <span className="text-slate-600 text-sm block mb-2">Recommendation</span>
              <p className="text-slate-900">{health.tokenHealth.recommendation}</p>
            </div>
          </div>

          {/* Quota Health */}
          <div className={`border rounded-lg p-6 ${getSeverityColor(health.quotaHealth.severity)}`}>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Quota Health</h3>
            <div className="space-y-3 mb-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-slate-900">Read Quota</span>
                  <span className="text-sm text-slate-600">
                    {health.quotaHealth.readQuota.remaining}/{health.quotaHealth.readQuota.limit}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{
                      width: `${(health.quotaHealth.readQuota.remaining / health.quotaHealth.readQuota.limit) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-slate-900">Draft Quota</span>
                  <span className="text-sm text-slate-600">
                    {health.quotaHealth.draftQuota.remaining}/{health.quotaHealth.draftQuota.limit}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{
                      width: `${(health.quotaHealth.draftQuota.remaining / health.quotaHealth.draftQuota.limit) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div>
              <span className="text-slate-600 text-sm block mb-2">Recommendation</span>
              <p className="text-slate-900">{health.quotaHealth.recommendation}</p>
            </div>
          </div>

          {/* Scope Health */}
          <div className={`border rounded-lg p-6 ${getSeverityColor(health.scopeHealth.severity)}`}>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Permission Scopes</h3>
            <div className="space-y-3 mb-4">
              <div>
                <span className="text-slate-600 text-sm">Scope Coverage</span>
                <div className="text-2xl font-bold text-slate-900">{health.scopeHealth.scopeCoverage}%</div>
              </div>
              {health.scopeHealth.missingScopes.length > 0 && (
                <div>
                  <span className="text-red-700 text-sm font-semibold block mb-2">Missing Scopes</span>
                  <ul className="space-y-1">
                    {health.scopeHealth.missingScopes.map((scope) => (
                      <li key={scope} className="text-sm text-slate-900 flex items-center">
                        <span className="mr-2">⚠</span>
                        {scope}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {health.scopeHealth.highRiskScopes.length > 0 && (
                <div>
                  <span className="text-orange-700 text-sm font-semibold block mb-2">High-Risk Scopes</span>
                  <ul className="space-y-1">
                    {health.scopeHealth.highRiskScopes.map((scope) => (
                      <li key={scope} className="text-sm text-slate-900 flex items-center">
                        <span className="mr-2">🔓</span>
                        {scope}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div>
              <span className="text-slate-600 text-sm block mb-2">Recommendation</span>
              <p className="text-slate-900">{health.scopeHealth.recommendation}</p>
            </div>
          </div>

          {/* Rate Limit Health */}
          <div className={`border rounded-lg p-6 ${getSeverityColor(health.rateLimitHealth.severity)}`}>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Rate Limit Status</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-slate-600 text-sm">Current Tier</span>
                <div className="text-xl font-bold text-slate-900">{health.rateLimitHealth.tier}</div>
              </div>
              <div>
                <span className="text-slate-600 text-sm">Requests Remaining</span>
                <div className="text-xl font-bold text-slate-900">{health.rateLimitHealth.remainingRequests}</div>
              </div>
            </div>
            <div>
              <span className="text-slate-600 text-sm block mb-2">Recommendation</span>
              <p className="text-slate-900">{health.rateLimitHealth.recommendation}</p>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {health.operatorWarnings.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Warnings ({health.operatorWarnings.length})</h2>
            <div className="space-y-3">
              {health.operatorWarnings.map((warning) => (
                <div key={warning.id} className={`border rounded p-3 ${getSeverityColor(warning.severity)}`}>
                  <div className="font-medium text-slate-900 mb-1">{warning.message}</div>
                  <div className="text-sm text-slate-700">Recommended action: {warning.recommendedAction}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
