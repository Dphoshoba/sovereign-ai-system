import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function resolveIntegrationStatus(provider: string, config: any) {
  const envKey = config?.envKey

  if (provider === "webhook") {
    return {
      status: "restricted",
      enabled: false,
      lastError: null,
    }
  }

  if (!envKey || !process.env[envKey]) {
    return {
      status: "not-configured",
      enabled: false,
      lastError: `${envKey || "ENV_KEY"} is missing`,
    }
  }

  return {
    status: "configured",
    enabled: true,
    lastError: null,
  }
}

const defaultIntegrations = [
  {
    name: "Email Provider",
    provider: "resend",
    category: "email",
    status: "not-configured",
    enabled: false,
    config: { envKey: "RESEND_API_KEY" },
  },
  {
    name: "Stripe Payments",
    provider: "stripe",
    category: "payments",
    status: "not-configured",
    enabled: false,
    config: { envKey: "STRIPE_SECRET_KEY" },
  },
  {
    name: "Calendar Booking",
    provider: "google-calendar",
    category: "scheduling",
    status: "not-configured",
    enabled: false,
    config: { envKey: "GOOGLE_CALENDAR_CLIENT_ID" },
  },
  {
    name: "Webhook Gateway",
    provider: "webhook",
    category: "automation",
    status: "restricted",
    enabled: false,
    config: { allowlistRequired: true },
  },
]

export async function GET() {
  try {
    let integrations = await prisma.externalIntegration.findMany({
      orderBy: { createdAt: "asc" },
    })

    if (integrations.length === 0) {
      await prisma.externalIntegration.createMany({
        data: defaultIntegrations,
      })

      integrations = await prisma.externalIntegration.findMany({
        orderBy: { createdAt: "asc" },
      })
    }

    const refreshedIntegrations = await Promise.all(
      integrations.map((integration) => {
        const health = resolveIntegrationStatus(
          integration.provider,
          integration.config
        )

        return prisma.externalIntegration.update({
          where: { id: integration.id },
          data: {
            status: health.status,
            enabled: health.enabled,
            lastError: health.lastError,
            lastChecked: new Date(),
          },
        })
      })
    )

    const logs = await prisma.externalOperationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({
      ok: true,
      integrations: refreshedIntegrations,
      logs,
    })
  } catch (error) {
    console.error("External operations fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch external operations" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.integration || !body.operationType || !body.title) {
      return NextResponse.json(
        {
          ok: false,
          error: "integration, operationType and title are required",
        },
        { status: 400 }
      )
    }

    const log = await prisma.externalOperationLog.create({
      data: {
        integration: body.integration,
        operationType: body.operationType,
        title: body.title,
        status: "queued",
        payload: body.payload || {},
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "external-operation-created",
        source: "external-operations",
        title: `External operation queued: ${body.title}`,
        message: body.operationType,
        severity: "medium",
        entityType: "ExternalOperationLog",
        entityId: log.id,
        payload: { logId: log.id },
      },
    })

    return NextResponse.json({
      ok: true,
      log,
    })
  } catch (error) {
    console.error("External operation create failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to create external operation" },
      { status: 500 }
    )
  }
}