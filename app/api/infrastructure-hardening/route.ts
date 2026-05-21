import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

type HealthCheckResult = {
  ok: boolean
  message: string
  metadata?: Record<string, unknown>
}

async function runHealthCheck(
  serviceName: string,
  serviceType: string,
  endpoint: string,
  check: () => Promise<HealthCheckResult>
) {
  const started = Date.now()

  try {
    const result = await check()

    return prisma.infrastructureHealthCheck.create({
      data: {
        systemName: serviceName,
        systemType: serviceType,
        status: result.ok ? "healthy" : "degraded",
        latencyMs: Date.now() - started,
        metadata: {
          endpoint,
          result,
        } as Prisma.InputJsonValue,
      },
    })
  } catch (error) {
    return prisma.infrastructureHealthCheck.create({
      data: {
        systemName: serviceName,
        systemType: serviceType,
        status: "down",
        latencyMs: Date.now() - started,
        metadata: {
          endpoint,
          error:
            error instanceof Error
              ? error.message
              : "Health check failed",
        } as Prisma.InputJsonValue,
      },
    })
  }
}

export async function GET(_request: NextRequest) {
  try {
    const checks = await Promise.all([
      runHealthCheck(
        "database",
        "postgres",
        "prisma",
        async () => {
          await prisma.$queryRaw`SELECT 1`

          return {
            ok: true,
            message: "Database connection healthy",
          }
        }
      ),

      runHealthCheck(
        "application-runtime",
        "nextjs",
        "runtime",
        async () => {
          return {
            ok: true,
            message: "Application runtime operational",
          }
        }
      ),

      runHealthCheck(
        "ai-services",
        "openai",
        "openai-api",
        async () => {
          return {
            ok: !!process.env.OPENAI_API_KEY,
            message: process.env.OPENAI_API_KEY
              ? "OpenAI API key configured"
              : "OpenAI API key missing",
          }
        }
      ),
    ])

    const healthy = checks.filter(
      (check: any) => check.status === "healthy"
    ).length

    const degraded = checks.filter(
      (check: any) => check.status === "degraded"
    ).length

    const down = checks.filter(
      (check: any) => check.status === "down"
    ).length

    return NextResponse.json({
      ok: true,
      summary: {
        total: checks.length,
        healthy,
        degraded,
        down,
      },
      checks,
    })
  } catch (error) {
    console.error("Infrastructure hardening failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Infrastructure hardening failed",
      },
      { status: 500 }
    )
  }
}