import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function seedTenant() {
  let org = await prisma.sovereignOrganization.findUnique({
    where: { slug: "echoes-visions" },
  })

  if (!org) {
    org = await prisma.sovereignOrganization.create({
      data: {
        name: "Echoes & Visions",
        slug: "echoes-visions",
        orgType: "creator-enterprise",
        plan: "sovereign",
        ownerEmail: "davidoshoba@gmail.com",
        settings: {
          defaultGovernance: "human-approved",
          aiAutonomy: "governed",
        },
      },
    })

    const workspace = await prisma.organizationWorkspace.create({
      data: {
        organizationId: org.id,
        name: "Executive Command Workspace",
        slug: "executive-command",
        workspaceType: "executive-runtime",
        settings: {
          primary: true,
        },
      },
    })

    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        email: "davidoshoba@gmail.com",
        name: "David George",
        role: "owner",
        permissions: {
          approveHighRisk: true,
          manageBilling: true,
          manageGovernance: true,
          executeRuntime: true,
        },
      },
    })

    await prisma.tenantGovernancePolicy.createMany({
      data: [
        {
          organizationId: org.id,
          title: "Tenant high-risk actions require owner approval",
          policyType: "execution",
          severity: "high",
          enforcement: "approval-required",
          rules: {
            riskLevels: ["high", "critical"],
            allowedRoles: ["owner"],
          },
        },
        {
          organizationId: org.id,
          title: "Tenant memory isolation required",
          policyType: "data-boundary",
          severity: "critical",
          enforcement: "strict",
          rules: {
            isolateMemoryByOrganization: true,
            isolateWorkspaceData: true,
          },
        },
      ],
    })

    await prisma.tenantIntelligenceRecord.create({
      data: {
        organizationId: org.id,
        workspaceId: workspace.id,
        recordType: "tenant-created",
        title: "Echoes & Visions tenant initialized",
        summary: "Primary sovereign organization workspace created.",
        sourceLayer: "tenant-runtime",
        priority: "high",
        payload: {
          organizationSlug: org.slug,
          workspaceSlug: workspace.slug,
        },
      },
    })
  }

  return org
}

export async function GET() {
  try {
    const org = await seedTenant()

    const [organizations, workspaces, members, policies, records, snapshots] =
      await Promise.all([
        prisma.sovereignOrganization.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        prisma.organizationWorkspace.findMany({
          orderBy: { createdAt: "desc" },
          take: 150,
        }),
        prisma.organizationMember.findMany({
          orderBy: { createdAt: "desc" },
          take: 150,
        }),
        prisma.tenantGovernancePolicy.findMany({
          orderBy: { createdAt: "desc" },
          take: 150,
        }),
        prisma.tenantIntelligenceRecord.findMany({
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
        prisma.tenantRuntimeSnapshot.findMany({
          orderBy: { createdAt: "desc" },
          take: 80,
        }),
      ])

    return NextResponse.json({
      ok: true,
      activeOrganization: org,
      organizations,
      workspaces,
      members,
      policies,
      records,
      snapshots,
    })
  } catch (error) {
    console.error("Tenant runtime fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch tenant runtime" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const org = await seedTenant()

    const workspace = await prisma.organizationWorkspace.findFirst({
      where: {
        organizationId: org.id,
        slug: body.workspaceSlug || "executive-command",
      },
    })

    const [
      sovereignSnapshots,
      governanceRisks,
      economicRuns,
      executivePulses,
      cognitiveInsights,
      runtimeHeartbeats,
      infrastructureRuns,
      auditTrail,
    ] = await Promise.all([
      prisma.sovereignRuntimeSnapshot.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.governanceRiskSignal.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.economicIntelligenceRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.executiveOperationalPulse.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.cognitiveInsight.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.runtimeHeartbeat.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.resilienceIncident.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.governanceAuditTrail.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
    ])

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Multi-Tenant Sovereign Organization Runtime for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Convert global platform state into tenant-scoped executive state. Maintain strict tenant boundaries and governance. Return valid JSON only.",
      input:
        "Generate a tenant runtime snapshot for the active organization.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "healthScore":82,
          "governanceScore":84,
          "executionScore":78,
          "economicScore":80,
          "state":{
            "organizationReality":"...",
            "workspaceFocus":"...",
            "highestPriority":"...",
            "governanceConcern":"...",
            "economicConcern":"...",
            "nextMove":"..."
          },
          "records":[
            {
              "recordType":"priority|risk|opportunity|governance|memory|execution",
              "title":"...",
              "summary":"...",
              "sourceLayer":"...",
              "priority":"low|medium|high",
              "payload":{}
            }
          ]
        }` +
        "\n\nOrganization:\n" +
        JSON.stringify(org) +
        "\n\nWorkspace:\n" +
        JSON.stringify(workspace) +
        "\n\nSovereign Snapshots:\n" +
        JSON.stringify(sovereignSnapshots) +
        "\n\nGovernance Risks:\n" +
        JSON.stringify(governanceRisks) +
        "\n\nEconomic Runs:\n" +
        JSON.stringify(economicRuns) +
        "\n\nExecutive Pulses:\n" +
        JSON.stringify(executivePulses) +
        "\n\nCognitive Insights:\n" +
        JSON.stringify(cognitiveInsights) +
        "\n\nRuntime Heartbeats:\n" +
        JSON.stringify(runtimeHeartbeats) +
        "\n\nInfrastructure Runs:\n" +
        JSON.stringify(infrastructureRuns) +
        "\n\nAudit Trail:\n" +
        JSON.stringify(auditTrail),
    })

    const parsed = JSON.parse(response.output_text)

    const snapshot = await prisma.tenantRuntimeSnapshot.create({
      data: {
        organizationId: org.id,
        workspaceId: workspace?.id || null,
        title: parsed.title || "Tenant Runtime Snapshot",
        summary: parsed.summary || null,
        healthScore: parsed.healthScore || 75,
        governanceScore: parsed.governanceScore || 75,
        executionScore: parsed.executionScore || 75,
        economicScore: parsed.economicScore || 75,
        state: parsed.state || {},
        status: "completed",
      },
    })

    const savedRecords = []

    for (const item of parsed.records || []) {
      const record = await prisma.tenantIntelligenceRecord.create({
        data: {
          organizationId: org.id,
          workspaceId: workspace?.id || null,
          recordType: item.recordType || "memory",
          title: item.title,
          summary: item.summary || null,
          sourceLayer: item.sourceLayer || "tenant-runtime",
          priority: item.priority || "medium",
          payload: item.payload || {},
          status: "active",
        },
      })

      savedRecords.push(record)
    }

    await prisma.operationalEvent.create({
      data: {
        type: "tenant-runtime-snapshot",
        source: "tenant-runtime",
        title: snapshot.title,
        message: snapshot.summary || null,
        severity: snapshot.healthScore <= 55 ? "high" : "medium",
        entityType: "TenantRuntimeSnapshot",
        entityId: snapshot.id,
        payload: {
          organizationId: org.id,
          workspaceId: workspace?.id || null,
          recordCount: savedRecords.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      organization: org,
      workspace,
      snapshot,
      records: savedRecords,
    })
  } catch (error) {
    console.error("Tenant runtime snapshot failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Tenant runtime snapshot failed",
      },
      { status: 500 }
    )
  }
}