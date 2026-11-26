/**
 * Dead Letter Detail Page
 * 
 * Detailed view of a specific dead-lettered execution with failure analysis and recovery recommendations.
 */

import { GmailResilienceReader } from '../../../lib/gamma/gmail-resilience-reader';

export default function DeadLetterDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const reader = new GmailResilienceReader();
  const dlq = reader.getDeadLetterById(params.id);

  if (!dlq) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-900 mb-2">Dead Letter Not Found</h1>
            <p className="text-red-700 mb-4">
              The dead-lettered execution with ID <code className="bg-red-100 px-2 py-1 rounded">{params.id}</code> could
              not be found.
            </p>
            <a href="/gmail-resilience" className="text-blue-600 hover:text-blue-800 font-medium">
              ← Back to Resilience Monitor
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <a href="/gmail-resilience" className="text-blue-600 hover:text-blue-800 font-medium mb-6 inline-block">
          ← Back to Resilience Monitor
        </a>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Dead-Letter Record</h1>
              <p className="text-slate-600">Failure Analysis & Recovery Recommendations</p>
            </div>
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-semibold">
              {dlq.failureClass.replace(/_/g, ' ').toUpperCase()}
            </div>
          </div>

          {/* Core Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Dead Letter ID</h3>
              <p className="font-mono text-slate-900 bg-slate-100 p-3 rounded">{dlq.id}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Execution ID</h3>
              <p className="font-mono text-slate-900 bg-slate-100 p-3 rounded">{dlq.executionId}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Draft Receipt ID</h3>
              <p className="font-mono text-slate-900 bg-slate-100 p-3 rounded">
                {dlq.draftReceiptId || 'N/A'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Created At</h3>
              <p className="text-slate-900 bg-slate-100 p-3 rounded">
                {dlq.createdAt.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Failure Details */}
          <div className="mb-8 pb-8 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Failure Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Failure Class</h3>
                <p className="text-slate-900 bg-slate-100 p-3 rounded capitalize">
                  {dlq.failureClass.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Attempts Made</h3>
                <p className="text-slate-900 bg-slate-100 p-3 rounded">{dlq.attempts}</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Last Error</h3>
                <p className="text-slate-900 bg-red-50 p-3 rounded font-mono text-sm border border-red-200">
                  {dlq.lastError}
                </p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Reason</h3>
                <p className="text-slate-900 bg-slate-100 p-3 rounded">{dlq.reason}</p>
              </div>
            </div>
          </div>

          {/* Operator Guidance */}
          <div className="mb-8 pb-8 border-b border-slate-200 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">Operator Message</h2>
            <p className="text-blue-800">{dlq.operatorMessage}</p>
          </div>

          {/* Recovery Recommendation */}
          <div className="mb-8 pb-8 border-b border-slate-200 bg-green-50 p-4 rounded-lg border border-green-200">
            <h2 className="text-lg font-semibold text-green-900 mb-3">Recommended Recovery Action</h2>
            <div className="flex items-center space-x-3">
              <div className="text-2xl">→</div>
              <div>
                <p className="font-semibold text-green-900 capitalize">
                  {dlq.recommendedRecovery.replace(/_/g, ' ')}
                </p>
                <p className="text-sm text-green-800 mt-1">
                  {getRecoveryActionDescription(dlq.recommendedRecovery)}
                </p>
              </div>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Audit Trail</h2>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="text-sm font-mono space-y-1">
                {dlq.auditIds.map((auditId: string) => (
                  <div key={auditId} className="text-slate-600">
                    • {auditId}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Expiration */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-900 mb-2">Retention</h3>
            <p className="text-yellow-800">
              This record will expire on{' '}
              <span className="font-semibold">{dlq.expiresAt.toLocaleString()}</span> (30 days from
              creation).
            </p>
          </div>
        </div>

        {/* Safety Assurances */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-green-900 mb-3">Safety Assurances</h3>
          <ul className="text-sm text-green-800 space-y-2">
            <li>✓ No email was sent - this was a draft operation</li>
            <li>✓ All credentials are secure - no tokens in this record</li>
            <li>✓ Permanent failure - will not be automatically retried</li>
            <li>✓ Manual review recommended before any recovery action</li>
            <li>✓ All related actions are logged in the audit trail</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function getRecoveryActionDescription(action: string): string {
  const descriptions: Record<string, string> = {
    retry: 'Attempt to retry the operation after conditions improve',
    refresh_oauth: 'Refresh OAuth credentials and retry',
    check_approval: 'Verify approval is still valid and conditions are met',
    check_quota: 'Check API quota and retry when available',
    manual_review: 'Manual operator review and decision required',
    dead_letter: 'Permanent dead-letter - no automatic recovery',
    escalate: 'Escalate to engineering team for investigation',
  };

  return descriptions[action] || 'See operator message above';
}
