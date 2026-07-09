/**
 * GET /api/connectors/gmail/hardening/rate-limit
 *
 * Returns rate limit health and current tier.
 * Preview-safe: never mutates.
 */

import { NextResponse } from 'next/server';
import { MOCK_AGGREGATE_HEALTH_READY } from '../../../../../../src/lib/gmail-hardening/mock-data';
import { RateLimitGuard } from '../../../../../../lib/connectors/gmail/rate-limit-guard';

export async function GET() {
  try {
    const health = MOCK_AGGREGATE_HEALTH_READY;
    const guard = new RateLimitGuard();
    const stats = guard.getStats(health.rateLimitHealth);

    return NextResponse.json(
      {
        score: health.rateLimitHealth.score,
        status: health.rateLimitHealth.status,
        tier: health.rateLimitHealth.tier,
        currentRequests: health.rateLimitHealth.currentRequests,
        remainingRequests: health.rateLimitHealth.remainingRequests,
        utilizationPercent: stats.utilizationPercent,
        windowRemaining: health.rateLimitHealth.windowRemaining,
        cooldownSeconds: health.rateLimitHealth.cooldownSeconds,
        canProceed: stats.canProceed,
        recommendation: health.rateLimitHealth.recommendation,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=10',
          'X-Preview-Safe': 'true',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
