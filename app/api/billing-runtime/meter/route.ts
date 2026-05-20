import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.organizationId || !body.meterType) {
      return NextResponse.json(
        { ok: false, error: "organizationId and meterType are required" },
        { status: 400 }
      )
    }

    const quantity = typeof body.quantity === "number" ? body.quantity : 1

    const usage = await prisma.usageMeterEvent.create({
      data: {
        organizationId: body.organizationId,
        workspaceId: body.workspaceId || null,
        meterType: body.meterType,
        quantity,
        unit: body.unit || "event",
        sourceLayer: body.sourceLayer || "manual",
        referenceType: body.referenceType || null,
        referenceId: body.referenceId || null,
        costAud: typeof body.costAud === "number" ? body.costAud : 0,
        metadata: body.metadata || {},
      },
    })

    let quota = await prisma.tenantQuotaState.findUnique({
      where: {
        organizationId_meterType: {
          organizationId: body.organizationId,
          meterType: body.meterType,
        },
      },
    })

    if (!quota) {
      quota = await prisma.tenantQuotaState.create({
        data: {
          organizationId: body.organizationId,
          meterType: body.meterType,
          limitValue: 0,
          usedValue: quantity,
          status: "unlimited-or-unconfigured",
        },
      })
    } else {
      const usedValue = quota.usedValue + quantity
      const status =
        quota.limitValue > 0 && usedValue >= quota.limitValue
          ? "limit-reached"
          : quota.limitValue > 0 && usedValue >= quota.limitValue * 0.8
            ? "near-limit"
            : "within-limit"

      quota = await prisma.tenantQuotaState.update({
        where: { id: quota.id },
        data: {
          usedValue,
          status,
        },
      })
    }

    if (quota.status === "near-limit" || quota.status === "limit-reached") {
      await prisma.operationalEvent.create({
        data: {
          type: "tenant-quota-warning",
          source: "billing-runtime",
          title: `Quota ${quota.status}: ${body.meterType}`,
          message: `Usage ${quota.usedValue}/${quota.limitValue}`,
          severity: quota.status === "limit-reached" ? "high" : "medium",
          entityType: "TenantQuotaState",
          entityId: quota.id,
          payload: {
            organizationId: body.organizationId,
            meterType: body.meterType,
          },
        },
      })
    }

    return NextResponse.json({
      ok: true,
      usage,
      quota,
    })
  } catch (error) {
    console.error("Usage meter failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Usage meter failed",
      },
      { status: 500 }
    )
  }
}