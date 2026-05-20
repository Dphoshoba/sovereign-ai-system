import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const starterPlans = [
  {
    name: "Starter",
    slug: "starter",
    description: "For solo creators and early-stage organizations.",
    priceAud: 49,
    billingCycle: "monthly",
    limits: {
      aiRuns: 250,
      realtimeEvents: 1000,
      workspaces: 2,
      members: 3,
    },
    features: ["tenant-runtime", "identity", "basic-governance"],
  },
  {
    name: "Growth",
    slug: "growth",
    description: "For growing creator teams, ministries and agencies.",
    priceAud: 149,
    billingCycle: "monthly",
    limits: {
      aiRuns: 1500,
      realtimeEvents: 10000,
      workspaces: 10,
      members: 25,
    },
    features: ["all-core-runtime", "governance", "economic-intelligence", "realtime-fabric"],
  },
  {
    name: "Sovereign",
    slug: "sovereign",
    description: "For institutional intelligence infrastructure.",
    priceAud: 499,
    billingCycle: "monthly",
    limits: {
      aiRuns: 10000,
      realtimeEvents: 100000,
      workspaces: 100,
      members: 250,
    },
    features: ["full-sovereign-runtime", "federation", "world-model", "priority-support"],
  },
]

async function seedBilling() {
  const plans = await prisma.billingPlan.findMany()

  if (plans.length === 0) {
    await prisma.billingPlan.createMany({
      data: starterPlans,
    })
  }

  const org = await prisma.sovereignOrganization.findUnique({
    where: { slug: "echoes-visions" },
  })

  if (org) {
    const plan = await prisma.billingPlan.findUnique({
      where: { slug: org.plan || "sovereign" },
    })

    const subscription = await prisma.tenantSubscription.findFirst({
      where: { organizationId: org.id },
    })

    if (!subscription) {
      await prisma.tenantSubscription.create({
        data: {
          organizationId: org.id,
          planId: plan?.id || null,
          planSlug: plan?.slug || org.plan || "sovereign",
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
          metadata: {
            seeded: true,
          },
        },
      })
    }

    if (plan?.limits) {
      const limits = plan.limits as Record<string, number>

      for (const [meterType, limitValue] of Object.entries(limits)) {
        await prisma.tenantQuotaState.upsert({
          where: {
            organizationId_meterType: {
              organizationId: org.id,
              meterType,
            },
          },
          update: {
            limitValue,
          },
          create: {
            organizationId: org.id,
            meterType,
            limitValue,
            usedValue: 0,
            resetPeriod: "monthly",
            resetAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
          },
        })
      }
    }
  }
}

export async function GET() {
  try {
    await seedBilling()

    const [plans, subscriptions, usageEvents, quotas, invoices, runs] =
      await Promise.all([
        prisma.billingPlan.findMany({
          orderBy: { priceAud: "asc" },
          take: 100,
        }),
        prisma.tenantSubscription.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        prisma.usageMeterEvent.findMany({
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
        prisma.tenantQuotaState.findMany({
          orderBy: { updatedAt: "desc" },
          take: 200,
        }),
        prisma.billingInvoiceRecord.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        prisma.billingIntelligenceRun.findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
      ])

    return NextResponse.json({
      ok: true,
      plans,
      subscriptions,
      usageEvents,
      quotas,
      invoices,
      runs,
    })
  } catch (error) {
    console.error("Billing runtime fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch billing runtime" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    await seedBilling()

    const [
      organizations,
      subscriptions,
      usageEvents,
      quotas,
      invoices,
      economicRuns,
      runtimeSnapshots,
      realtimeRuns,
    ] = await Promise.all([
      prisma.sovereignOrganization.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.tenantSubscription.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.usageMeterEvent.findMany({ orderBy: { createdAt: "desc" }, take: 300 }),
      prisma.tenantQuotaState.findMany({ orderBy: { updatedAt: "desc" }, take: 200 }),
      prisma.billingInvoiceRecord.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.economicIntelligenceRun.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.sovereignRuntimeSnapshot.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.realtimeFabricRun.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
    ])

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Sovereign Economic and Billing Runtime for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Analyze tenant plans, usage, quotas, billing health, AI cost pressure and monetization sustainability. Return valid JSON only.",
      input:
        "Generate billing intelligence.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "revenueHealth":82,
          "usageHealth":78,
          "quotaRisk":30,
          "costRisk":35,
          "findings":{
            "billingStrengths":["..."],
            "billingRisks":["..."],
            "quotaConcerns":["..."],
            "costOptimization":["..."],
            "monetizationRecommendations":["..."]
          }
        }` +
        "\n\nOrganizations:\n" + JSON.stringify(organizations) +
        "\n\nSubscriptions:\n" + JSON.stringify(subscriptions) +
        "\n\nUsage Events:\n" + JSON.stringify(usageEvents) +
        "\n\nQuotas:\n" + JSON.stringify(quotas) +
        "\n\nInvoices:\n" + JSON.stringify(invoices) +
        "\n\nEconomic Runs:\n" + JSON.stringify(economicRuns) +
        "\n\nRuntime Snapshots:\n" + JSON.stringify(runtimeSnapshots) +
        "\n\nRealtime Runs:\n" + JSON.stringify(realtimeRuns),
    })

    const parsed = JSON.parse(response.output_text)

    const run = await prisma.billingIntelligenceRun.create({
      data: {
        title: parsed.title || "Billing Intelligence Run",
        summary: parsed.summary || null,
        revenueHealth: parsed.revenueHealth || 75,
        usageHealth: parsed.usageHealth || 75,
        quotaRisk: parsed.quotaRisk || 30,
        costRisk: parsed.costRisk || 30,
        findings: parsed.findings || {},
        status: "completed",
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "billing-intelligence-run",
        source: "billing-runtime",
        title: run.title,
        message: run.summary || null,
        severity:
          run.costRisk >= 75 || run.quotaRisk >= 75
            ? "high"
            : "medium",
        entityType: "BillingIntelligenceRun",
        entityId: run.id,
        payload: {
          runId: run.id,
          revenueHealth: run.revenueHealth,
          costRisk: run.costRisk,
          quotaRisk: run.quotaRisk,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      run,
    })
  } catch (error) {
    console.error("Billing intelligence run failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Billing intelligence run failed",
      },
      { status: 500 }
    )
  }
}