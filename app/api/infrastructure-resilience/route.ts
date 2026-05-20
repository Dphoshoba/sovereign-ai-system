import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const starterPolicies = [
  {
    title: "Critical service failure creates incident",
    policyType: "health-monitoring",
    targetService: "critical-services",
    severity: "critical",
    rule: {
      status: ["failed", "unavailable"],
    },
    action: {
      createIncident: true,
      notifyGovernance: true,
    },
  },
  {
    title: "Failed external operations enter retry queue",
    policyType: "retry",
    targetService: "external-operations",
    severity: "high",
    rule: {
      status: ["failed"],
      maxAttempts: 3,
    },
    action: {
      queueRetry: true,
      escalateAfterMaxAttempts: true,
    },
  },
  {
    title: "High-risk infrastructure incidents require governance review",
    policyType: "governance-escalation",
    targetService: "infrastructure",
    severity: "high",
    rule: {
      riskLevel: ["high", "critical"],
    },
    action: {
      requireApproval: true,
      createGovernanceRisk: true,
    },
  },
]

async function seedPolicies() {
  const existing = await prisma.resiliencePolicy.findMany()

  if (existing.length === 0) {
    await prisma.resiliencePolicy.createMany({
      data: starterPolicies,
    })
  }
}

async function checkService(serviceName: string, serviceType: string, check: () => Promise<any>) {
  const start = Date.now()

  try {
    const result = await check()
    const latencyMs = Date.now() - start

    return prisma.infrastructureHealthCheck.create({
      data: {
        serviceName,
        serviceType,
        status: "healthy",
        latencyMs,
        message: "Service responded successfully.",
        metadata: result || {},
      },
    })
  } catch (error) {
    const latencyMs = Date.now() - start

    return prisma.infrastructureHealthCheck.create({
      data: {
        serviceName,
        serviceType,
        status: "failed",
        latencyMs,
        message: error instanceof Error ? error.message : "Health check failed",
        metadata: {},
      },
    })
  }
}

export async function GET() {
  try {
    await seedPolicies()

    const [checks, incidents, policies, retryJobs, runs] = await Promise.all([
      prisma.infrastructureHealthCheck.findMany({
        orderBy: { checkedAt: "desc" },
        take: 150,
      }),
      prisma.resilienceIncident.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.resiliencePolicy.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.infrastructureRetryJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.infrastructureResilienceRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ])

    return NextResponse.json({
      ok: true,
      checks,
      incidents,
      policies,
      retryJobs,
      runs,
    })
  } catch (error) {
    console.error("Infrastructure resilience fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch infrastructure resilience data" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    await seedPolicies()

    const healthChecks = await Promise.all([
      checkService("Database", "database", async () => {
        const count = await prisma.operationalEvent.count()
        return { operationalEventCount: count }
      }),

      checkService("OpenAI", "ai-provider", async () => {
        if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing")
        return { configured: true }
      }),

      checkService("Resend Email", "email-provider", async () => {
        if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing")
        if (!process.env.EMAIL_FROM) throw new Error("EMAIL_FROM missing")
        return { configured: true, from: process.env.EMAIL_FROM }
      }),

      checkService("Sovereign Runtime", "application-layer", async () => {
        const latest = await prisma.sovereignRuntimeSnapshot.findFirst({
          orderBy: { createdAt: "desc" },
        })
        return { latestSnapshot: latest?.id || null }
      }),
    ])

    const [
      failedEmails,
      failedActions,
      failedSovereignActions,
      failedFederationActions,
      failedEvolutionActions,
      openGovernanceRisks,
      recentEvents,
    ] = await Promise.all([
      prisma.emailExecution.findMany({
        where: { status: "failed" },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.toolExecutionAction.findMany({
        where: { status: "failed" },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.sovereignRuntimeAction.findMany({
        where: { status: "failed" },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.federationAction.findMany({
        where: { status: "failed" },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.recursiveEvolutionAction.findMany({
        where: { status: "failed" },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.governanceRiskSignal.findMany({
        where: { status: "open" },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.operationalEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
    ])

    for (const check of healthChecks) {
      if (check.status === "failed") {
        await prisma.resilienceIncident.create({
          data: {
            title: `${check.serviceName} health check failed`,
            incidentType: "service-health",
            severity: check.serviceType === "database" ? "critical" : "high",
            status: "open",
            source: check.serviceName,
            description: check.message,
            impact: "Service degradation may affect runtime reliability.",
            metadata: {
              healthCheckId: check.id,
            },
          },
        })
      }
    }

    const failedItems = [
      ...failedEmails.map((item) => ({
        source: "emailExecution",
        sourceId: item.id,
        title: item.subject,
        error: item.error,
      })),
      ...failedActions.map((item) => ({
        source: "toolExecutionAction",
        sourceId: item.id,
        title: item.title,
        error: item.error,
      })),
      ...failedSovereignActions.map((item) => ({
        source: "sovereignRuntimeAction",
        sourceId: item.id,
        title: item.title,
        error: item.error,
      })),
      ...failedFederationActions.map((item) => ({
        source: "federationAction",
        sourceId: item.id,
        title: item.title,
        error: item.error,
      })),
      ...failedEvolutionActions.map((item) => ({
        source: "recursiveEvolutionAction",
        sourceId: item.id,
        title: item.title,
        error: item.error,
      })),
    ]

    for (const item of failedItems) {
      const existing = await prisma.infrastructureRetryJob.findFirst({
        where: {
          source: item.source,
          sourceId: item.sourceId,
          status: {
            in: ["queued", "running"],
          },
        },
      })

      if (!existing) {
        await prisma.infrastructureRetryJob.create({
          data: {
            title: `Retry: ${item.title}`,
            source: item.source,
            sourceId: item.sourceId,
            status: "queued",
            priority: "high",
            lastError: item.error || null,
            maxAttempts: 3,
            payload: item,
            nextRunAt: new Date(Date.now() + 15 * 60 * 1000),
          },
        })
      }
    }

    const aiResponse = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Sovereign Infrastructure Hardening Layer for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Analyze system reliability, incidents, retry risks and operational resilience. Return valid JSON only.",
      input:
        "Analyze infrastructure health and resilience.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "healthScore":80,
          "resilienceScore":76,
          "riskScore":35,
          "findings":{
            "healthySystems":["..."],
            "weakSystems":["..."],
            "reliabilityRisks":["..."],
            "recoveryActions":["..."],
            "hardeningRecommendations":["..."]
          },
          "incidents":[
            {
              "title":"...",
              "incidentType":"service-health|execution-failure|retry-risk|governance-risk|performance-risk",
              "severity":"low|medium|high|critical",
              "source":"...",
              "description":"...",
              "impact":"..."
            }
          ]
        }` +
        "\n\nHealth Checks:\n" + JSON.stringify(healthChecks) +
        "\n\nFailed Items:\n" + JSON.stringify(failedItems) +
        "\n\nOpen Governance Risks:\n" + JSON.stringify(openGovernanceRisks) +
        "\n\nRecent Events:\n" + JSON.stringify(recentEvents),
    })

    const parsed = JSON.parse(aiResponse.output_text)

    const run = await prisma.infrastructureResilienceRun.create({
      data: {
        title: parsed.title || "Infrastructure Resilience Run",
        summary: parsed.summary || null,
        healthScore: parsed.healthScore || 75,
        resilienceScore: parsed.resilienceScore || 75,
        riskScore: parsed.riskScore || 40,
        findings: parsed.findings || {},
        status: "completed",
      },
    })

    for (const item of parsed.incidents || []) {
      await prisma.resilienceIncident.create({
        data: {
          title: item.title,
          incidentType: item.incidentType || "performance-risk",
          severity: item.severity || "medium",
          source: item.source || "infrastructure-resilience",
          description: item.description || null,
          impact: item.impact || null,
          status: "open",
        },
      })
    }

    await prisma.operationalEvent.create({
      data: {
        type: "infrastructure-resilience-run",
        source: "infrastructure-resilience",
        title: run.title,
        message: run.summary || null,
        severity:
          run.riskScore >= 75
            ? "critical"
            : run.riskScore >= 55
              ? "high"
              : "medium",
        entityType: "InfrastructureResilienceRun",
        entityId: run.id,
        payload: {
          runId: run.id,
          healthScore: run.healthScore,
          resilienceScore: run.resilienceScore,
          riskScore: run.riskScore,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      run,
      healthChecks,
    })
  } catch (error) {
    console.error("Infrastructure resilience run failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Infrastructure resilience run failed",
      },
      { status: 500 }
    )
  }
}