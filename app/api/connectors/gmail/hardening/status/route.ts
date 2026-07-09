/**
 * GET /api/connectors/gmail/hardening/status
 *
 * Returns production readiness status.
 * Preview-safe: never mutates.
 */

import { NextResponse } from 'next/server';
import { MOCK_AGGREGATE_HEALTH_READY } from '../../../../../../src/lib/gmail-hardening/mock-data';

export async function GET() {
  try {
    const health = MOCK_AGGREGATE_HEALTH_READY;

    return NextResponse.json(
      {
        productionReady: health.productionReadiness.score >= 85,
        score: health.productionReadiness.score,
        status: health.productionReadiness.status,
        recommendation: health.productionReadiness.recommendation,
        lastChecked: health.productionReadiness.lastValidated,
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
