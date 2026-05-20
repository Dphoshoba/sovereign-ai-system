import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function hasEnv(key: string) {
  return Boolean(process.env[key])
}

export async function POST() {
  try {
    const integrations = await prisma.externalIntegration.findMany()
    const updated = []

    for (const integration of integrations) {
      const config = integration.config as { envKey?: string } | null
      const envKey = config?.envKey

      const configured = envKey ? hasEnv(envKey) : false

      const item = await prisma.externalIntegration.update({
        where: { id: integration.id },
        data: {
          status: configured
            ? "configured"
            : integration.provider === "webhook"
              ? "restricted"
              : "not-configured",
          enabled: configured,
          lastChecked: new Date(),
          lastError: configured ? null : envKey ? `Missing ${envKey}` : null,
        },
      })

      updated.push(item)
    }

    await prisma.operationalEvent.create({
      data: {
        type: "external-integrations-checked",
        source: "external-operations",
        title: "External integration health check completed",
        message: `Checked ${updated.length} integrations.`,
        severity: "info",
        payload: { count: updated.length },
      },
    })

    return NextResponse.json({
      ok: true,
      integrations: updated,
    })
  } catch (error) {
    console.error("Integration check failed:", error)

    return NextResponse.json(
      { ok: false, error: "Integration check failed" },
      { status: 500 }
    )
  }
}