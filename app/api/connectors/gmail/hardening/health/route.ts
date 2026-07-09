/**
 * GET /api/connectors/gmail/hardening/health
 *
 * Returns current Gmail connector health status.
 * Preview-safe: never mutates, always returns simulation data.
 */

import { NextResponse } from 'next/server';
import { HealthChecker } from '../../../../../../lib/connectors/gmail/health-checker';
import { MOCK_AGGREGATE_HEALTH_READY } from '../../../../../../src/lib/gmail-hardening/mock-data';

export async function GET() {
  try {
    const checker = new HealthChecker();

    // In simulation mode (ENABLE_REAL_EXECUTION !== 'true'), return mock data
    if (process.env.ENABLE_REAL_EXECUTION !== 'true') {
      // Return healthy state by default for demo
      return NextResponse.json(MOCK_AGGREGATE_HEALTH_READY, {
        headers: {
          'Cache-Control': 'public, max-age=30',
          'X-Preview-Safe': 'true',
        },
      });
    }

    // In real execution mode, would perform actual health checks
    // For now, return mock data
    return NextResponse.json(MOCK_AGGREGATE_HEALTH_READY, {
      headers: {
        'Cache-Control': 'public, max-age=30',
        'X-Preview-Safe': 'true',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
