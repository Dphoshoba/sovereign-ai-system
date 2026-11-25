'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GmailHardeningReader } from '../../lib/gamma/gmail-hardening-reader';
import type { GmailHardeningAggregateHealth } from '../../src/lib/gmail-hardening/types';

export default function GmailHardeningDashboard() {
  const [health, setHealth] = useState<GmailHardeningAggregateHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const response = await fetch('/api/connectors/gmail/hardening/health');
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
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gmail Production Hardening</h1>
          <p className="text-slate-600 mb-8">Loading health status...</p>
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gmail Production Hardening</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
            <p className="font-semibold">Error loading health data</p>
            <p className="text-sm mt-2">Unable to fetch connector health status.</p>
          </div>
        </div>
      </div>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getHealthBadge = (score: number) => {
    if (score >= 90) return { bg: 'bg-green-100', text: 'text-green-800', label: 'Healthy' };
    if (score >= 70) return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Degraded' };
    return { bg: 'bg-red-100', text: 'text-red-800', label: 'Critical' };
  };

  const productionBadge = getHealthBadge(health.productionReadiness.score);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gmail Production Hardening</h1>
          <p className="text-slate-600">
            Monitor connector health, production readiness, and operational metrics.
          </p>
        </div>

        {/* Production Readiness Card */}
        <div className={`border rounded-lg p-6 mb-6 ${getHealthColor(health.productionReadiness.score)}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Production Readiness</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${productionBadge.bg} ${productionBadge.text}`}>
              {productionBadge.label}
            </span>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-700 font-medium">Score: {health.productionReadiness.score}/100</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
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
          <p className="text-slate-700 text-sm">{health.productionReadiness.recommendation}</p>
        </div>

        {/* Health Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* OAuth Health */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">OAuth Health</h3>
            <div className="text-3xl font-bold text-slate-900 mb-2">{health.tokenHealth.score}</div>
            <div
              className={`text-xs font-semibold px-2 py-1 rounded ${
                health.tokenHealth.status === 'healthy'
                  ? 'bg-green-100 text-green-800'
                  : health.tokenHealth.status === 'degraded'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {health.tokenHealth.status}
            </div>
            <p className="text-xs text-slate-600 mt-3">{health.tokenHealth.recommendation}</p>
          </div>

          {/* Quota Health */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quota Health</h3>
            <div className="text-3xl font-bold text-slate-900 mb-2">{health.quotaHealth.quotaScore}</div>
            <div
              className={`text-xs font-semibold px-2 py-1 rounded ${
                health.quotaHealth.status === 'healthy'
                  ? 'bg-green-100 text-green-800'
                  : health.quotaHealth.status === 'degraded'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {health.quotaHealth.status}
            </div>
            <p className="text-xs text-slate-600 mt-3">Read: {health.quotaHealth.readQuota.remaining}/{health.quotaHealth.readQuota.limit}</p>
          </div>

          {/* Scope Health */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Scope Coverage</h3>
            <div className="text-3xl font-bold text-slate-900 mb-2">{health.scopeHealth.scopeCoverage}%</div>
            <div
              className={`text-xs font-semibold px-2 py-1 rounded ${
                health.scopeHealth.status === 'healthy'
                  ? 'bg-green-100 text-green-800'
                  : health.scopeHealth.status === 'degraded'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {health.scopeHealth.status}
            </div>
            <p className="text-xs text-slate-600 mt-3">{health.scopeHealth.missingScopes.length} missing scope(s)</p>
          </div>

          {/* Rate Limit Health */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Rate Limit</h3>
            <div className="text-3xl font-bold text-slate-900 mb-2">{health.rateLimitHealth.rateLimitScore}</div>
            <div
              className={`text-xs font-semibold px-2 py-1 rounded ${
                health.rateLimitHealth.status === 'healthy'
                  ? 'bg-green-100 text-green-800'
                  : health.rateLimitHealth.status === 'degraded'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {health.rateLimitHealth.tier}
            </div>
            <p className="text-xs text-slate-600 mt-3">{health.rateLimitHealth.remainingRequests} requests remaining</p>
          </div>
        </div>

        {/* Component Health */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Component Health</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(health.connectorHealth).map(([component, score]) => (
              <div key={component} className="text-center">
                <div className="text-2xl font-bold text-slate-900 mb-1">{score}</div>
                <div className="text-xs text-slate-600 capitalize">{component.replace(/_/g, ' ')}</div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operator Warnings */}
        {health.operatorWarnings.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Operator Warnings ({health.operatorWarnings.length})</h2>
            <div className="space-y-3">
              {health.operatorWarnings.map((warning) => {
                const severityColor = {
                  critical: 'bg-red-50 border-red-200',
                  high: 'bg-orange-50 border-orange-200',
                  medium: 'bg-yellow-50 border-yellow-200',
                  low: 'bg-blue-50 border-blue-200',
                };
                const badgeColor = {
                  critical: 'bg-red-100 text-red-800',
                  high: 'bg-orange-100 text-orange-800',
                  medium: 'bg-yellow-100 text-yellow-800',
                  low: 'bg-blue-100 text-blue-800',
                };
                return (
                  <div key={warning.id} className={`border rounded p-3 ${severityColor[warning.severity as keyof typeof severityColor]}`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${badgeColor[warning.severity as keyof typeof badgeColor]}`}>
                        {warning.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 mb-1">{warning.message}</p>
                    <p className="text-xs text-slate-700">Action: {warning.recommendedAction}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommended Actions */}
        {health.recommendedActions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Recommended Actions</h2>
            <ul className="space-y-2">
              {health.recommendedActions.map((action, idx) => (
                <li key={idx} className="text-sm text-blue-900 flex items-start">
                  <span className="mr-3">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
