/**
 * API Route: Gmail OAuth Callback Handler
 * GET /api/connectors/gmail/oauth/callback?code=...&state=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { GmailAuthenticator } from '../../../../../../lib/connectors/gmail/authenticator';
import { gmailManifest } from '../../../../../../lib/connectors/gmail/manifest';
import { encrypt } from '../../../../../../lib/connectors/utils/encryption';
import { prisma } from '../../../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/connectors/connect/gmail?error=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          '/connectors/connect/gmail?error=missing_code',
          request.url
        )
      );
    }

    // Exchange code for tokens
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const redirectUri = `${origin}/api/connectors/gmail/oauth/callback`;
    const authenticator = new GmailAuthenticator(redirectUri);

    const tokenResponse = await authenticator.exchangeCodeForTokens(code);

    // Get user profile from Google
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenResponse.accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch user profile from Google');
    }

    const profile = await profileResponse.json() as any;

    // For Build 131, we're using a placeholder user ID
    // In production, this would come from the authenticated session
    const userId = 'user_placeholder'; // TODO: Get from session

    // Check if Gmail connector exists, create if not
    let connector = await prisma.connector.findUnique({
      where: { key: 'gmail' },
    });

    if (!connector) {
      connector = await prisma.connector.create({
        data: {
          key: 'gmail',
          name: gmailManifest.name,
          provider: gmailManifest.provider,
          category: gmailManifest.category,
          description: gmailManifest.description,
          authType: gmailManifest.authType,
        },
      });
    }

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokenResponse.expiresIn * 1000);

    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(tokenResponse.accessToken);
    const encryptedRefreshToken = tokenResponse.refreshToken
      ? encrypt(tokenResponse.refreshToken)
      : null;

    // Create or update connection
    const connection = await prisma.connectorConnection.upsert({
      where: {
        connectorId_userId_accountId: {
          connectorId: connector.id,
          userId,
          accountId: profile.id,
        },
      },
      create: {
        connectorId: connector.id,
        userId,
        displayName: `Gmail Account: ${profile.email}`,
        accountId: profile.id,
        email: profile.email,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        status: 'active',
        metadata: {
          picture: profile.picture,
          name: profile.name,
          locale: profile.locale,
        },
      },
      update: {
        displayName: `Gmail Account: ${profile.email}`,
        email: profile.email,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken || undefined,
        expiresAt,
        status: 'active',
        lastUsedAt: new Date(),
        metadata: {
          picture: profile.picture,
          name: profile.name,
          locale: profile.locale,
        },
      },
    });

    // Create audit entry
    await prisma.connectorAudit.create({
      data: {
        connectorId: connector.id,
        connectionId: connection.id,
        executionId: 'audit_' + Date.now(), // Placeholder
        operator: userId,
        action: 'oauth_connect',
        riskLevel: 'low',
        status: 'success',
        input: {},
        output: {
          email: profile.email,
          name: profile.name,
        } as any,
      },
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL(
        `/connectors/connect/gmail?success=true&connectionId=${connection.id}`,
        request.url
      )
    );
  } catch (error) {
    console.error('Gmail OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/connectors/connect/gmail?error=${encodeURIComponent(
          error instanceof Error ? error.message : 'Unknown error'
        )}`,
        request.url
      )
    );
  }
}
