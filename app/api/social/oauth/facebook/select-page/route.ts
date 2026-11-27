import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePublishingEditor } from "../../../../../../lib/publishing/require-editor-auth"
import {
  FACEBOOK_INTEGRATION_NAME,
  applyFacebookPageSelection,
  selectAuthorisedFacebookPage,
  type FacebookIntegrationConfig,
} from "../../../../../../lib/social/facebook-oauth"

/**
 * Explicit Facebook Page selection after OAuth.
 * Rejects Page ids that are not in the authorised accounts list.
 * Never auto-selects.
 */
export async function POST(req: NextRequest) {
  const auth = await requirePublishingEditor()
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()
    const pageId = typeof body?.pageId === "string" ? body.pageId.trim() : ""

    if (!pageId) {
      return NextResponse.json(
        { ok: false, error: "Missing pageId" },
        { status: 400 },
      )
    }

    const integration = await prisma.externalIntegration.findUnique({
      where: { name: FACEBOOK_INTEGRATION_NAME },
    })

    if (!integration || !integration.enabled) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Facebook is not connected. Authorize via /api/social/oauth/facebook/authorize.",
        },
        { status: 503 },
      )
    }

    const config = (integration.config || {}) as FacebookIntegrationConfig
    const availablePages = Array.isArray(config.availablePages)
      ? config.availablePages
      : []

    const selected = selectAuthorisedFacebookPage({ availablePages, pageId })
    if (!selected.ok) {
      return NextResponse.json(
        { ok: false, code: selected.code, error: selected.error },
        { status: 403 },
      )
    }

    const nextConfig = applyFacebookPageSelection(config, selected.page)

    await prisma.externalIntegration.update({
      where: { name: FACEBOOK_INTEGRATION_NAME },
      data: {
        status: "connected",
        config: nextConfig,
        lastChecked: new Date(),
        lastError: null,
      },
    })

    return NextResponse.json({
      ok: true,
      pageId: selected.page.id,
      pageName: selected.page.name,
      tasks: selected.page.tasks,
      // Never return page access token.
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Page selection failed",
      },
      { status: 500 },
    )
  }
}
