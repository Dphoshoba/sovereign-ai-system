import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEditorAuth } from "../../../../../../lib/publishing/require-editor-auth"
import {
  FACEBOOK_INTEGRATION_NAME,
  inspectFacebookConnectionReadiness,
  readFacebookEnv,
  summariseFacebookPages,
  type FacebookIntegrationConfig,
} from "../../../../../../lib/social/facebook-oauth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const env = readFacebookEnv()
  const integration = await prisma.externalIntegration.findUnique({
    where: { name: FACEBOOK_INTEGRATION_NAME },
  })
  const config = (integration?.config || null) as FacebookIntegrationConfig | null

  const readiness = inspectFacebookConnectionReadiness({
    envConfigured: env.ok,
    integrationEnabled: integration?.enabled,
    config,
  })

  return NextResponse.json({
    ok: true,
    connected: readiness.connected,
    status: readiness.status,
    envConfigured: env.ok,
    missingEnv: env.ok ? [] : env.missing,
    graphVersion: env.ok ? env.config.graphVersion : null,
    userIdPresent: readiness.userIdPresent,
    pageSelected: readiness.pageSelected,
    pageId: config?.pageId ?? null,
    pageName: config?.pageName ?? null,
    availablePageCount: readiness.availablePageCount,
    availablePages: summariseFacebookPages(config?.availablePages),
    scopes: config?.scopes ?? null,
    limitations: {
      personalProfilePublishing: false,
      autoPageSelection: false,
      distributionScopeChannel: false,
      note: "Facebook remains out of Production distribution-scope until R4. Explicit Page selection required.",
    },
  })
}
