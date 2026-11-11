/**
 * API Route: Slack Status
 */
import { NextRequest, NextResponse } from 'next/server';
import { SlackReader } from '@/../lib/gamma/slack-reader';
import { requireEditorAuth } from "../../../../../lib/publishing/require-editor-auth"

export async function GET(request: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const reader = new SlackReader();
    const summary = reader.getSummary(new Date());
    return NextResponse.json({
      status: 'healthy',
      connector: 'slack',
      service: 'Slack',
      summary,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
