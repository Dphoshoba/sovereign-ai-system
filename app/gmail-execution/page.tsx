'use client';

import Link from 'next/link';

export default function GmailExecutionPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">Gmail Execution</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Running Executions</h2>
          <p className="text-gray-600 mb-4">Monitor and manage active Gmail executions</p>
          <Link href="/gmail-execution?state=running" className="text-blue-600 hover:underline">
            View Running →
          </Link>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Completed Executions</h2>
          <p className="text-gray-600 mb-4">View successfully completed Gmail operations</p>
          <Link href="/gmail-execution?state=completed" className="text-blue-600 hover:underline">
            View Completed →
          </Link>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Failed Executions</h2>
          <p className="text-gray-600 mb-4">Manage and retry failed executions</p>
          <Link href="/gmail-execution?state=failed" className="text-blue-600 hover:underline">
            View Failed →
          </Link>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Dead-Letter Queue</h2>
          <p className="text-gray-600 mb-4">Review permanently failed executions</p>
          <Link href="/gmail-execution?state=dead_lettered" className="text-blue-600 hover:underline">
            View DLQ →
          </Link>
        </div>
      </div>

      <div className="mt-10 border rounded-lg p-6 bg-blue-50">
        <h2 className="text-2xl font-semibold mb-4">Execution Safety</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>All executions require valid approval</li>
          <li>Approvals expire after 7 days</li>
          <li>Idempotency keys prevent duplicate sends</li>
          <li>Failed jobs retry with exponential backoff (5s, 10s, 20s)</li>
          <li>After 3 retries, jobs move to dead-letter queue</li>
          <li>Complete audit trail for all actions</li>
        </ul>
      </div>
    </div>
  );
}
