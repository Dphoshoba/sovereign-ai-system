/**
 * API Route: List Gmail Connections
 * GET /api/connectors/gmail/connections
 * DELETE /api/connectors/gmail/connections/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from session
    const userId = request.nextUrl.searchParams.get('userId') || 'user_placeholder';

    const gmailConnector = await prisma.connector.findUnique({
      where: { key: 'gmail' },
      include: {
        connections: {
          where: { userId },
          select: {
            id: true,
            displayName: true,
            email: true,
            status: true,
            lastUsedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!gmailConnector) {
      return NextResponse.json({
        success: false,
        error: 'Gmail connector not found',
      });
    }

    return NextResponse.json({
      success: true,
      connections: gmailConnector.connections,
    });
  } catch (error) {
    console.error('List connections error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
