import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

async function seedIdentity() {
  let user = await prisma.identityUser.findUnique({
    where: { email: "davidoshoba@gmail.com" },
  })

  const org = await prisma.sovereignOrganization.findUnique({
    where: { slug: "echoes-visions" },
  })

  if (!user) {
    user = await prisma.identityUser.create({
      data: {
        email: "davidoshoba@gmail.com",
        name: "David George",
        defaultOrgId: org?.id || null,
        metadata: {
          source: "identity-runtime-seed",
        },
      },
    })
  }

  if (org) {
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: org.id,
        email: user.email,
      },
    })

    if (!existingMember) {
      await prisma.organizationMember.create({
        data: {
          organizationId: org.id,
          email: user.email,
          name: user.name,
          role: "owner",
          permissions: {
            manageOrganization: true,
            manageGovernance: true,
            approveActions: true,
            manageBilling: true,
            executeRuntime: true,
          },
        },
      })
    }

    const existingPolicy = await prisma.tenantAccessPolicy.findFirst({
      where: {
        organizationId: org.id,
        resource: "admin",
        action: "access",
      },
    })

    if (!existingPolicy) {
      await prisma.tenantAccessPolicy.createMany({
        data: [
          {
            organizationId: org.id,
            title: "Admin access requires owner or admin role",
            resource: "admin",
            action: "access",
            allowedRoles: ["owner", "admin"],
          },
          {
            organizationId: org.id,
            title: "Governance approval requires owner role",
            resource: "governance",
            action: "approve",
            allowedRoles: ["owner"],
          },
          {
            organizationId: org.id,
            title: "Runtime execution requires owner or operator role",
            resource: "runtime",
            action: "execute",
            allowedRoles: ["owner", "operator"],
          },
        ],
      })
    }
  }

  return user
}

export async function GET() {
  try {
    await seedIdentity()

    const [users, sessions, invitations, accessPolicies, accessLogs] =
      await Promise.all([
        prisma.identityUser.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        prisma.identitySession.findMany({
          orderBy: { createdAt: "desc" },
          take: 150,
        }),
        prisma.organizationInvitation.findMany({
          orderBy: { createdAt: "desc" },
          take: 150,
        }),
        prisma.tenantAccessPolicy.findMany({
          orderBy: { createdAt: "desc" },
          take: 150,
        }),
        prisma.accessDecisionLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
      ])

    return NextResponse.json({
      ok: true,
      users,
      sessions,
      invitations,
      accessPolicies,
      accessLogs,
    })
  } catch (error) {
    console.error("Identity runtime fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch identity runtime" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.email) {
      return NextResponse.json(
        { ok: false, error: "email is required" },
        { status: 400 }
      )
    }

    const email = body.email.toLowerCase().trim()

    let user = await prisma.identityUser.findUnique({
      where: { email },
    })

    if (!user) {
      user = await prisma.identityUser.create({
        data: {
          email,
          name: body.name || null,
          metadata: {
            source: "manual-login-simulation",
          },
        },
      })
    }

    const org = body.organizationId
      ? await prisma.sovereignOrganization.findUnique({
          where: { id: body.organizationId },
        })
      : await prisma.sovereignOrganization.findFirst({
          where: {
            OR: [{ id: user.defaultOrgId || "" }, { ownerEmail: email }],
          },
        })

    const membership = org
      ? await prisma.organizationMember.findFirst({
          where: {
            organizationId: org.id,
            email,
            status: "active",
          },
        })
      : null

    const workspace = org
      ? await prisma.organizationWorkspace.findFirst({
          where: {
            organizationId: org.id,
            status: "active",
          },
          orderBy: { createdAt: "asc" },
        })
      : null

    const session = await prisma.identitySession.create({
      data: {
        userId: user.id,
        email: user.email,
        organizationId: org?.id || null,
        workspaceId: workspace?.id || null,
        role: membership?.role || null,
        status: "active",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12),
        metadata: {
          simulated: true,
          orgSlug: org?.slug || null,
        },
      },
    })

    await prisma.identityUser.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        defaultOrgId: org?.id || user.defaultOrgId,
      },
    })

    await prisma.accessDecisionLog.create({
      data: {
        userId: user.id,
        email: user.email,
        organizationId: org?.id || null,
        workspaceId: workspace?.id || null,
        action: "login",
        resource: "identity",
        decision: "allowed",
        reason: "Session created through identity runtime.",
        role: membership?.role || null,
      },
    })

    return NextResponse.json({
      ok: true,
      user,
      session,
      organization: org,
      workspace,
      membership,
    })
  } catch (error) {
    console.error("Identity login/session failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Identity session failed",
      },
      { status: 500 }
    )
  }
}