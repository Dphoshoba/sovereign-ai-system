import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const starterPolicies = [
  {
    title: "Retry failed external email actions",
    policyType: "retry",
    targetSystem: "email",
    severity: "medium",
    rules: {
      statuses: ["failed"],
      maxAttempts: 3,
    },
    actions: {
      createRecoveryAction: true,
    },
  },
  {
    title: "Escalate critical governance risks",
    policyType: "escalation",
    targetSystem: "governance",
    severity: "critical",
    rules: {
      severities: ["critical", "high"],
    },
    actions: {
      createIncident: true,
      requireReview: true,
    },
  },
  {
    title: "Protect sovereign runtime availability",
    policyType: "availability",
    targetSystem: "sovereign-runtime",
    severity: "high",
    rules: {
      minimumHealth: 65,
    },
    actions: {
      createIncident: true,
      createRuntimeObjective: true,
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

async function checkService(
  serviceName: string,
  serviceType: string,
  check: () => Promise<{ ok: boolean; message: string; metadata?: any }>
) {
  const started = Date.now()

  try {
    const result = await check()

    return prisma.infrastructureHealthCheck.create({
      data: {
        serviceName,
        serviceType,
        status: result.ok ? "healthy" : "degraded",
        latencyMs: Date.now() - started,
        message: result.message,
        metadata: result.metadata || {},
      },
    })
  } catch (error) {
    return prisma.infrastructureHealthCheck.create({
      data: {
        serviceName,
        serviceType,
        status: "down",
        latencyMs: Date.now() - started,
        message: error instanceof Error ? error.message : "Health check failed",
        metadata: {},
      },
    })
  }
}

export async function GET() {
  try {
    await seedPolicies()

    const [healthChecks, incidents, policies, recoveryActions] =
      await Promise.all([
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
        prisma.resilienceRecoveryAction.findMany({
          orderBy: { createdAt: "desc" },
          take: 120,
        }),
      ])

    return NextResponse.json({
      ok: true,
      healthChecks,
      incidents,
      policies,
      recoveryActions,
    })
  } catch (error) {
    console.error("Infrastructure hardening fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch infrastructure hardening layer" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    await seedPolicies()

    const checks = await Promise.all([
      checkService("Database", "postgres", async () => {
        await prisma.$queryRaw`SELECT 1`
        return { ok: true, message: "Database query successful" }
      }),

      checkService("OpenAI", "ai-provider", async () => {
        return {
          ok: Boolean(process.env.OPENAI_API_KEY),
          message: process.env.OPENAI_API_KEY
            ? "OpenAI API key configured"
            : "OPENAI_API_KEY missing",
        }
      }),

      checkService("Resend", "email-provider", async () => {
        return {
          ok: Boolean(process.env.RESEND_API_KEY),
          message: process.env.RESEND_API_KEY
            ? "Resend API key configured"
            : "RESEND_API_KEY missing",
        }
      }),

      checkService("Email From", "email-identity", async () => {
        return {
          ok: Boolean(process.env.EMAIL_FROM),
          message: process.env.EMAIL_FROM
            ? `EMAIL_FROM configured as ${process.env.EMAIL_FROM}`
            : "EMAIL_FROM missing",
        }
      }),
    ])

    const failedEmails = await prisma.emailExecution.findMany({
      where: { status: "failed" },
      take: 20,
      orderBy: { createdAt: "desc" },
    })

    const criticalRisks = await prisma.governanceRiskSignal.findMany({
      where: {
        status: "open",
        severity: { in: ["high", "critical"] },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    })

    const unhealthyChecks = checks.filter((check) =>
      ["degraded", "down"].includes(check.status)
    )

    const createdIncidents = []
    const createdRecoveryActions = []

    for (const check of unhealthyChecks) {
      const incident = await prisma.resilienceIncident.create({
        data: {
          title: `${check.serviceName} health degraded`,
          incidentType: "health-check-failure",
          severity: check.status === "down" ? "high" : "medium",
          status: "open",
          sourceSystem: check.serviceName,
          description: check.message,
          recoveryPlan: {
            checkId: check.id,
            recommendedActions: [
              "Verify environment variables",
              "Restart application server",
              "Review deployment logs",
              "Escalate if repeated",
            ],
          },
        },
      })

      createdIncidents.push(incident)

      const action = await prisma.resilienceRecoveryAction.create({
        data: {
          incidentId: incident.id,
          title: `Recover ${check.serviceName}`,
          actionType: "manual-recovery",
          targetSystem: check.serviceName,
          priority: incident.severity,
          status: "queued",
          payload: {
            serviceName: check.serviceName,
            message: check.message,
          },
          nextRunAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      })

      createdRecoveryActions.push(action)
    }

    for (const email of failedEmails) {
      const action = await prisma.resilienceRecoveryAction.create({
        data: {
          title: `Retry failed email: ${email.subject}`,
          actionType: "retry-email",
          targetSystem: "email",
          priority: "medium",
          status: "queued",
          payload: {
            emailId: email.id,
            to: email.to,
            subject: email.subject,
          },
          nextRunAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      })

      createdRecoveryActions.push(action)
    }

    for (const risk of criticalRisks) {
      const incident = await prisma.resilienceIncident.create({
        data: {
          title: `Governance risk: ${risk.title}`,
          incidentType: "governance-risk",
          severity: risk.severity,
          status: "open",
          sourceSystem: risk.affectedArea || "governance",
          description: risk.description,
          recoveryPlan: {
            recommendation: risk.recommendation,
            riskId: risk.id,
          },
        },
      })

      createdIncidents.push(incident)
    }

    await prisma.operationalEvent.create({
      data: {
        type: "infrastructure-hardening-scan",
        source: "infrastructure-hardening",
        title: "Infrastructure hardening scan completed",
        message: `Completed ${checks.length} health checks, created ${createdIncidents.length} incidents and ${createdRecoveryActions.length} recovery actions.`,
        severity: createdIncidents.some((i) => i.severity === "critical")
          ? "critical"
          : createdIncidents.length
            ? "high"
            : "info",
        payload: {
          checkCount: checks.length,
          incidentCount: createdIncidents.length,
          recoveryActionCount: createdRecoveryActions.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      checks,
      incidents: createdIncidents,
      recoveryActions: createdRecoveryActions,
    })
  } catch (error) {
    console.error("Infrastructure hardening scan failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Infrastructure hardening scan failed",
      },
      { status: 500 }
    )
  }
}