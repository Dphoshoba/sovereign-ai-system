'use client';

import { useState, useEffect } from 'react';
import type { GmailCertificationResult } from '../../src/lib/gmail-certification/types';

export default function GmailCertificationDashboard() {
  const [certification, setCertification] = useState<GmailCertificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCertification() {
      try {
        const response = await fetch('/api/connectors/gmail/certification/status');
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
    const interval = setInterval(fetchCertification, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gmail Certification</h1>
          <p className="text-slate-600">Loading certification data...</p>
        </div>
      </div>
    );
  }

  if (!certification) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gmail Certification</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
            <p className="font-semibold">Certification data not available</p>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = {
    certified: 'bg-green-50 border-green-200',
    'at-risk': 'bg-yellow-50 border-yellow-200',
    'not-certified': 'bg-red-50 border-red-200',
  };

  const statusTextColor = {
    certified: 'text-green-800',
    'at-risk': 'text-yellow-800',
    'not-certified': 'text-red-800',
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gmail Connector Certification</h1>
          <p className="text-slate-600">Version 1.0 — Reference Implementation for Gamma Phase XV</p>
        </div>

        {/* Certification Status Card */}
        <div className={`border rounded-lg p-6 mb-6 ${statusColor[certification.status]}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className={`text-sm font-semibold ${statusTextColor[certification.status]}`}>
                Certification Status
              </span>
              <div className="text-3xl font-bold text-slate-900 mt-1 capitalize">{certification.status}</div>
            </div>
            <div>
              <span className="text-slate-600 text-sm">Overall Score</span>
              <div className="text-3xl font-bold text-slate-900 mt-1">{certification.overallScore}/100</div>
            </div>
            <div>
              <span className="text-slate-600 text-sm">Certified Date</span>
              <div className="text-lg font-semibold text-slate-900 mt-1">
                {new Date(certification.timestamp).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Certification', value: certification.metrics.certificationScore },
            { label: 'Reference Ready', value: certification.metrics.referenceReadiness },
            { label: 'Safety', value: certification.metrics.connectorSafetyScore },
            { label: 'Tests', value: certification.metrics.testCoverageScore },
            { label: 'Documentation', value: certification.metrics.documentationScore },
          ].map((metric) => (
            <div key={metric.label} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-sm font-medium text-slate-600">{metric.label}</div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{metric.value}/100</div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
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
            </div>
          ))}
        </div>

        {/* Category Results */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Category Results</h2>
          <div className="space-y-3">
            {certification.categories.map((category) => (
              <div key={category.category} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                <div>
                  <div className="font-medium text-slate-900">{category.category}</div>
                  <div className="text-sm text-slate-600">
                    {category.passedChecks}/{category.totalChecks} checks passed
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900">{category.score}</div>
                    <div
                      className={`text-xs font-semibold ${
                        category.status === 'certified'
                          ? 'text-green-700'
                          : category.status === 'at-risk'
                            ? 'text-yellow-700'
                            : 'text-red-700'
                      }`}
                    >
                      {category.status.replace('-', ' ').toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {certification.recommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Recommendations</h2>
            <ul className="space-y-2">
              {certification.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-1">•</span>
                  <span className="text-slate-900">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
