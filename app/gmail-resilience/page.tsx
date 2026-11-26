/**
 * Gmail Resilience Dashboard
 * 
 * Overview of resilience metrics, failure classifications, and dead-letter queue.
 * Shows failure trends and recovery actions.
 */

import { GmailResilienceReader } from '../../lib/gamma/gmail-resilience-reader';
import type { ResilienceMetrics } from '../../src/lib/gmail-resilience/types';

export default function GmailResiliencePage() {
  const reader = new GmailResilienceReader();
  const currentTime = new Date();
  const metrics = reader.getMetrics(currentTime);
  const deadLetters = reader.getAllDeadLetters();
  const stats = reader.getStats();

  const failuresByClassification = reader.getFailureCountByClassification();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Gmail Resilience Monitor</h1>
          <p className="text-lg text-slate-600">
            Failure classification, retry orchestration, and dead-letter queue management
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="text-sm font-medium text-slate-600">Health Score</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{metrics.healthScore}</div>
            <div className="text-xs text-slate-500 mt-1">out of 100</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="text-sm font-medium text-slate-600">Resilience Score</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{metrics.resilienceScore}</div>
            <div className="text-xs text-slate-500 mt-1">Recovery capability</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="text-sm font-medium text-slate-600">Safety Score</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">{metrics.safetyScore}</div>
            <div className="text-xs text-slate-500 mt-1">All operations gated</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="text-sm font-medium text-slate-600">Recovery Rate</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">
              {Math.round(metrics.recoveryRate * 100)}%
            </div>
            <div className="text-xs text-slate-500 mt-1">of retryable failures</div>
          </div>
        </div>

        {/* Failure Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Failure Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total Failures</span>
                <span className="text-2xl font-bold text-slate-900">{stats.totalFailures}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Retryable</span>
                <span className="text-lg font-semibold text-blue-600">
                  {stats.retryableFailuresCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Dead-lettered</span>
                <span className="text-lg font-semibold text-red-600">
                  {stats.deadLetteredFailuresCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Retry Attempts</span>
                <span className="text-lg font-semibold text-amber-600">
                  {stats.totalRetryAttempts}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Failure Classifications</h3>
            <div className="space-y-2">
              {Object.entries(failuresByClassification)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([classification, count]) => (
                  <div key={classification} className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 capitalize">{classification.replace(/_/g, ' ')}</span>
                    <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Recovery Actions</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">OAuth Refresh Success</span>
                <span className="text-lg font-bold text-green-600">
                  {metrics.oauthRefreshRecoveryCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Duplicate Blocked</span>
                <span className="text-lg font-bold text-blue-600">
                  {metrics.duplicateBlockedCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Receipt Verification</span>
                <span className="text-lg font-bold text-purple-600">
                  {metrics.receiptVerificationScore}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dead Letter Queue */}
        {deadLetters.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Dead-Letter Queue</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Execution ID
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Reason</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Attempts</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {deadLetters.slice(0, 5).map(dlq => (
                    <tr key={dlq.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-slate-600">{dlq.executionId}</td>
                      <td className="py-3 px-4">
                        <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-medium">
                          {dlq.failureClass.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{dlq.attempts}</td>
                      <td className="py-3 px-4">
                        <a
                          href={`/gmail-resilience/${dlq.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Details
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {deadLetters.length > 5 && (
                <div className="mt-4 text-center text-sm text-slate-600">
                  ... and {deadLetters.length - 5} more items in queue
                </div>
              )}
            </div>
          </div>
        )}

        {/* Safe Operation Guarantee */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h4 className="text-sm font-semibold text-green-900 mb-2">Safety Guarantees</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>✓ No email sending - drafts only</li>
            <li>✓ All failures classified and routed appropriately</li>
            <li>✓ Retry only for safe, retryable failures</li>
            <li>✓ OAuth refresh attempted before retry</li>
            <li>✓ Duplicate creation prevented</li>
            <li>✓ Permanent failures dead-lettered</li>
            <li>✓ No token leakage in logs or UI</li>
            <li>✓ All actions audited</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
