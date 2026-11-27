import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEditorAuth } from "../../../../../../lib/publishing/require-editor-auth"
import {
  THREADS_INTEGRATION_NAME,
  inspectThreadsConnectionReadiness,
  readThreadsEnv,
} from "../../../../../../lib/social/threads-oauth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const env = readThreadsEnv()
  const integration = await prisma.externalIntegration.findUnique({
    where: { name: THREADS_INTEGRATION_NAME },
  })

  const readiness = inspectThreadsConnectionReadiness({
    envConfigured: env.ok,
    integrationEnabled: integration?.enabled,
    config: (integration?.config || null) as Record<string, unknown> | null,
  })

  return NextResponse.json({
    ok: true,
    connected: readiness.connected,
    status: readiness.status,
    envConfigured: env.ok,
    missingEnv: env.ok ? [] : env.missing,
    userIdPresent: readiness.userIdPresent,
    usernamePresent: readiness.usernamePresent,
    accessTokenPresent: readiness.accessTokenPresent,
    scopes:
      integration &&
      typeof (integration.config as Record<string, unknown> | null)?.scopes ===
        "string"
        ? (integration.config as Record<string, unknown>).scopes
        : null,
    limitations: {
      organizationPublishing: false,
      mediaPublishing: false,
      distributionScopeChannel: false,
      note: "Threads remains out of Production distribution-scope until R4.",
    },
  })
}
