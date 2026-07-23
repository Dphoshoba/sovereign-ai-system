import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const integration = await prisma.externalIntegration.findUnique({
    where: { name: "LinkedIn" },
  })

  if (!integration || !integration.enabled) {
    return NextResponse.json({
      ok: true,
      connected: false,
      status: "not_configured",
    })
  }

  const config = integration.config as Record<string, unknown> | null
  const accessToken = config?.accessToken as string | undefined
  const expiresAt = config?.expiresAt as string | undefined

  if (!accessToken) {
    return NextResponse.json({ ok: true, connected: false, status: "disconnected" })
  }

  if (expiresAt && new Date(expiresAt) < new Date()) {
    return NextResponse.json({ ok: true, connected: false, status: "token_expired" })
  }

  return NextResponse.json({
    ok: true,
    connected: true,
    status: "connected",
    memberUrn: config?.memberUrn,
    memberName: config?.memberName,
    scopes: config?.scopes,
    providerStatus: config?.providerStatus,
    openIdEnabled: config?.openIdEnabled ?? false,
    limitations: {
      memberIdentityAvailable: !!config?.memberUrn,
      organizationPublishing: false,
      openIdProductEnabled: config?.openIdEnabled ?? false,
    },
  })
}
