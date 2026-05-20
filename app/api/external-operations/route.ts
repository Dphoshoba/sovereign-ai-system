import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

    const logs = await prisma.externalOperationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({
      ok: true,
      integrations,
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