/**
 * GET /api/connectors/gmail/hardening/scopes
 *
 * Returns permission scope health and validation.
 * Preview-safe: never mutates.
 */

import { NextResponse } from 'next/server';
import { MOCK_AGGREGATE_HEALTH_READY } from '../../../../../../src/lib/gmail-hardening/mock-data';

export async function GET() {
  try {
    const health = MOCK_AGGREGATE_HEALTH_READY;

    return NextResponse.json(
      {
        score: health.scopeHealth.score,
        status: health.scopeHealth.status,
        coverage: health.scopeHealth.scopeCoverage,
        missingScopes: health.scopeHealth.missingScopes,
        highRiskScopes: health.scopeHealth.highRiskScopes,
        recommendation: health.scopeHealth.recommendation,
        productionReady: health.scopeHealth.missingScopes.length === 0 && health.scopeHealth.highRiskScopes.length === 0,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60',
          'X-Preview-Safe': 'true',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
