import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.organizationId || !body.planSlug) {
      return NextResponse.json(
        { ok: false, error: "organizationId and planSlug are required" },
        { status: 400 }
      )
    }

    const plan = await prisma.billingPlan.findUnique({
      where: { slug: body.planSlug },
    })

    if (!plan) {
      return NextResponse.json(
        { ok: false, error: "Billing plan not found" },
        { status: 404 }
      )
    }

    const subscription = await prisma.tenantSubscription.upsert({
      where: {
        id:
          body.subscriptionId ||
          (
            await prisma.tenantSubscription.findFirst({
              where: { organizationId: body.organizationId },
            })
          )?.id ||
          "new",
      },
      update: {
        planId: plan.id,
        planSlug: plan.slug,
        status: body.status || "active",
        metadata: body.metadata || {},
      },
      create: {
        organizationId: body.organizationId,
        planId: plan.id,
        planSlug: plan.slug,
        status: body.status || "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        metadata: body.metadata || {},
      },
    })

    await prisma.sovereignOrganization.update({
      where: { id: body.organizationId },
      data: {
        plan: plan.slug,
      },
    })

    const limits = (plan.limits || {}) as Record<string, number>

    for (const [meterType, limitValue] of Object.entries(limits)) {
      await prisma.tenantQuotaState.upsert({
        where: {
          organizationId_meterType: {
            organizationId: body.organizationId,
            meterType,
          },
        },
        update: {
          limitValue,
          resetAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        },
        create: {
          organizationId: body.organizationId,
          meterType,
          limitValue,
          usedValue: 0,
          resetAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        },
      })
    }

    await prisma.operationalEvent.create({
      data: {
        type: "tenant-subscription-updated",
        source: "billing-runtime",
        title: `Subscription updated to ${plan.name}`,
        message: `Organization moved to ${plan.slug}.`,
        severity: "medium",
        entityType: "TenantSubscription",
        entityId: subscription.id,
        payload: {
          organizationId: body.organizationId,
          planSlug: plan.slug,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      subscription,
      plan,
    })
  } catch (error) {
    console.error("Subscription update failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Subscription update failed",
      },
      { status: 500 }
    )
  }
}