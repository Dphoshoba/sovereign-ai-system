'use client';

import Link from 'next/link';

export default function ExecutionDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Link href="/gmail-execution" className="text-blue-600 hover:underline">
          ← Back to Executions
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-8">Execution: {params.id}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Execution Details</h2>
          <dl className="space-y-2">
            <div>
              <dt className="font-medium text-gray-600">Status</dt>
              <dd className="text-gray-900">Loading...</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Draft ID</dt>
              <dd className="text-gray-900 font-mono">-</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Started At</dt>
              <dd className="text-gray-900">-</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Attempt</dt>
              <dd className="text-gray-900">-</dd>
            </div>
          </dl>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Audit Trail</h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">Fetching audit events...</p>
          </div>
        </div>

        <div className="border rounded-lg p-6 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
              Retry
            </button>
            <button className="px-4 py-2 bg-red-200 rounded hover:bg-red-300">
              Cancel
            </button>
            <button className="px-4 py-2 bg-blue-200 rounded hover:bg-blue-300">
              View Audit Log
            </button>
          </div>
        </div>

        <div className="border rounded-lg p-6 md:col-span-2 bg-amber-50">
          <h2 className="text-xl font-semibold mb-4">Safety Policy</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>Approval must exist and not be expired</li>
            <li>OAuth must be valid</li>
            <li>Idempotency key must be unique</li>
            <li>Draft must pass all validations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
