/**
 * GET /api/connectors/gmail/hardening/quota
 *
 * Returns quota health and utilization.
 * Preview-safe: never mutates.
 */

import { NextResponse } from 'next/server';
import { MOCK_AGGREGATE_HEALTH_READY } from '../../../../../../src/lib/gmail-hardening/mock-data';
import { QuotaMonitor } from '../../../../../../lib/connectors/gmail/quota-monitor';

export async function GET() {
  try {
    const health = MOCK_AGGREGATE_HEALTH_READY;
    const monitor = new QuotaMonitor();
    const utilization = monitor.getUtilizationPercent(health.quotaHealth);

    return NextResponse.json(
      {
        score: health.quotaHealth.quotaScore,
        status: health.quotaHealth.status,
        exceeded: health.quotaHealth.quotaExceeded,
        warning: health.quotaHealth.quotaWarning,
        quotas: {
          read: {
            limit: health.quotaHealth.readQuota.limit,
            remaining: health.quotaHealth.readQuota.remaining,
            utilization: utilization.read,
          },
          draft: {
            limit: health.quotaHealth.draftQuota.limit,
            remaining: health.quotaHealth.draftQuota.remaining,
            utilization: utilization.draft,
          },
          execution: {
            limit: health.quotaHealth.executionQuota.limit,
            remaining: health.quotaHealth.executionQuota.remaining,
            utilization: utilization.execution,
          },
          retry: {
            limit: health.quotaHealth.retryQuota.limit,
            remaining: health.quotaHealth.retryQuota.remaining,
            utilization: utilization.retry,
          },
        },
        recommendation: health.quotaHealth.recommendation,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=30',
          'X-Preview-Safe': 'true',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
