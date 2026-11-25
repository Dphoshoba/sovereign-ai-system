/**
 * API Route: Get Gmail OAuth Authorization URL
 * POST /api/connectors/gmail/oauth/authorize
 */

import { NextRequest, NextResponse } from 'next/server';
import { GmailAuthenticator } from '../../../../../../lib/connectors/gmail/authenticator';

export async function POST(request: NextRequest) {
  try {
    // Get the origin for redirect URI
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const redirectUri = `${origin}/api/connectors/gmail/oauth/callback`;

    // Create authenticator and get auth URL
    const authenticator = new GmailAuthenticator(redirectUri);
    const authUrl = authenticator.getAuthorizationUrl();

    return NextResponse.json({
      success: true,
      authUrl,
      redirect: true,
    });
  } catch (error) {
    console.error('Gmail OAuth authorize error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Allow GET for CORS preflight
  return NextResponse.json(
    {
      message: 'POST to get authorization URL',
    },
    { status: 405 }
  );
}
