/**
 * API Route: Disconnect Gmail Connection
 * DELETE /api/connectors/gmail/connections/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const connectionId = id;

    // Get the connection
    const connection = await prisma.connectorConnection.findUnique({
      where: { id: connectionId },
      include: { connector: true },
    });

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          error: 'Connection not found',
        },
        { status: 404 }
      );
    }

    // Delete the connection (cascade will handle related audits)
    await prisma.connectorConnection.delete({
      where: { id: connectionId },
    });

    // Create audit entry
    await prisma.connectorAudit.create({
      data: {
        connectorId: connection.connectorId,
        connectionId: connectionId,
        executionId: 'audit_' + Date.now(),
        operator: connection.userId,
        action: 'oauth_disconnect',
        riskLevel: 'low',
        status: 'success',
        output: {
          email: connection.email,
          timestamp: new Date().toISOString(),
        } as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Connection disconnected',
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
