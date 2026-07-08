/**
 * API Route: Gmail Connector Health Check
 * GET /api/connectors/gmail/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { gmailManifest, validateGmailManifest } from '../../../../../lib/connectors/gmail/manifest';

export async function GET(request: NextRequest) {
  try {
    // Validate configuration
    const validation = validateGmailManifest();

    return NextResponse.json({
      success: validation.valid,
      connector: {
        key: gmailManifest.key,
        name: gmailManifest.name,
        provider: gmailManifest.provider,
        status: validation.valid ? 'ready' : 'misconfigured',
      },
      configuration: {
        valid: validation.valid,
        errors: validation.errors,
      },
      actions: Object.keys(gmailManifest.actions),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
