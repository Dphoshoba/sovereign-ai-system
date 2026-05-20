import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { ok: false, error: "Organization name is required" },
        { status: 400 }
      )
    }

    const slug = body.slug ? slugify(body.slug) : slugify(body.name)

    const existing = await prisma.sovereignOrganization.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Organization slug already exists" },
        { status: 409 }
      )
    }

    const organization = await prisma.sovereignOrganization.create({
      data: {
        name: body.name,
        slug,
        orgType: body.orgType || "organization",
        plan: body.plan || "starter",
        ownerEmail: body.ownerEmail || null,
        settings: {
          governanceMode: "human-approved",
          memoryIsolation: true,
          ...body.settings,
        },
      },
    })

    const workspace = await prisma.organizationWorkspace.create({
      data: {
        organizationId: organization.id,
        name: "Main Workspace",
        slug: "main",
        workspaceType: "operations",
        settings: {
          default: true,
        },
      },
    })

    if (body.ownerEmail) {
      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          email: body.ownerEmail,
          name: body.ownerName || null,
          role: "owner",
          permissions: {
            manageOrganization: true,
            manageGovernance: true,
            approveActions: true,
          },
        },
      })
    }

    await prisma.tenantGovernancePolicy.create({
      data: {
        organizationId: organization.id,
        title: "Owner approval required for high-risk tenant actions",
        policyType: "execution",
        severity: "high",
        enforcement: "approval-required",
        rules: {
          riskLevels: ["high", "critical"],
          allowedRoles: ["owner"],
        },
      },
    })

    await prisma.tenantIntelligenceRecord.create({
      data: {
        organizationId: organization.id,
        workspaceId: workspace.id,
        recordType: "organization-created",
        title: `${organization.name} initialized`,
        summary: "Tenant organization and default workspace were created.",
        sourceLayer: "tenant-runtime",
        priority: "high",
      },
    })

    return NextResponse.json({
      ok: true,
      organization,
      workspace,
    })
  } catch (error) {
    console.error("Organization creation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Organization creation failed",
      },
      { status: 500 }
    )
  }
}