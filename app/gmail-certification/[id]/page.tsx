'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { GmailCertificationResult } from '../../../src/lib/gmail-certification/types';

export default function CertificationDetail() {
  const params = useParams();
  const id = params.id as string;
  const [certification, setCertification] = useState<GmailCertificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCertification() {
      try {
        const response = await fetch(`/api/connectors/gmail/certification/${id}`);
        if (response.ok) {
          const data = await response.json();
          setCertification(data);
        }
      } catch (error) {
        console.error('Failed to fetch certification:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCertification();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Certification Details</h1>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!certification) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Certification Details</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
            Certification not found
          </div>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  const failedChecks = certification.allChecks.filter((c) => !c.passed);
  const passedChecks = certification.allChecks.filter((c) => c.passed);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a href="/gmail-certification" className="text-blue-600 hover:text-blue-700 text-sm mb-4">
            ← Back to Certification
          </a>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Certification Report</h1>
          <p className="text-slate-600">
            ID: <span className="font-mono text-sm">{certification.certificationId}</span>
          </p>
        </div>

        {/* Overall Score */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-slate-600 text-sm">Overall Score</span>
              <div className="text-4xl font-bold text-slate-900 mt-1">{certification.overallScore}/100</div>
              <div className="w-full bg-slate-200 rounded-full h-3 mt-3">
                <div
                  className={`h-3 rounded-full ${
                    certification.overallScore >= 90
                      ? 'bg-green-500'
                      : certification.overallScore >= 70
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${certification.overallScore}%` }}
                />
              </div>
            </div>
            <div>
              <span className="text-slate-600 text-sm">Status</span>
              <div className="text-2xl font-bold text-slate-900 mt-1 capitalize">{certification.status}</div>
              <div className="mt-3 text-sm">
                <span
                  className={`px-3 py-1 rounded-full font-medium ${
                    certification.status === 'certified'
                      ? 'bg-green-100 text-green-700'
                      : certification.status === 'at-risk'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  {certification.readyForProduction ? 'Production Ready' : 'Not Ready'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Detail */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Detailed Metrics</h2>
          <div className="space-y-3">
            {[
              { label: 'Certification Score', value: certification.metrics.certificationScore },
              { label: 'Reference Readiness', value: certification.metrics.referenceReadiness },
              { label: 'Connector Safety', value: certification.metrics.connectorSafetyScore },
              { label: 'Test Coverage', value: certification.metrics.testCoverageScore },
              { label: 'Documentation', value: certification.metrics.documentationScore },
              { label: 'Production Readiness', value: certification.metrics.productionReadinessScore },
              { label: 'Hardening', value: certification.metrics.hardeningScore },
              { label: 'Compliance', value: certification.metrics.complianceScore },
              { label: 'Health', value: certification.metrics.healthScore },
            ].map((metric) => (
              <div key={metric.label} className="flex items-center justify-between">
                <span className="text-slate-900 font-medium">{metric.label}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        metric.value >= 90
                          ? 'bg-green-500'
                          : metric.value >= 70
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                  <span className="text-slate-900 font-bold w-12 text-right">{metric.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Passed Checks */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Passed Checks ({passedChecks.length})
          </h2>
          <div className="space-y-2">
            {passedChecks.map((check) => (
              <div key={check.id} className="flex items-start gap-2 p-2 rounded bg-green-100/30">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <div>
                  <div className="font-medium text-slate-900">{check.name}</div>
                  <div className="text-sm text-slate-600">{check.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Failed Checks */}
        {failedChecks.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Failed Checks ({failedChecks.length})
            </h2>
            <div className="space-y-2">
              {failedChecks.map((check) => (
                <div key={check.id} className={`border rounded p-3 ${getSeverityColor(check.severity)}`}>
                  <div className="font-medium">{check.name}</div>
                  <div className="text-sm mt-1">{check.message}</div>
                  {check.recommendation && (
                    <div className="text-sm mt-2 font-semibold">
                      Recommendation: {check.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Category Breakdown</h2>
          <div className="space-y-3">
            {certification.categories.map((category) => (
              <div key={category.category} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-slate-900">{category.category}</div>
                  <div className="text-sm font-bold text-slate-700">{category.score}/100</div>
                </div>
                <div className="flex gap-2 text-sm text-slate-600 mb-2">
                  <span>✓ {category.passedChecks} passed</span>
                  {category.failedChecks > 0 && <span>✗ {category.failedChecks} failed</span>}
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      category.status === 'certified'
                        ? 'bg-green-500'
                        : category.status === 'at-risk'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${category.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
