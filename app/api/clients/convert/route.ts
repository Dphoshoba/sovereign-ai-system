import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { leadId } = await request.json()

    if (!leadId) {
      return NextResponse.json(
        {
          ok: false,
          error: "leadId is required",
        },
        { status: 400 }
      )
    }

    const lead = await prisma.creatorLead.findUnique({
      where: {
        id: leadId,
      },
    })

    if (!lead) {
      return NextResponse.json(
        {
          ok: false,
          error: "Lead not found",
        },
        { status: 404 }
      )
    }

    const existingClient =
      await prisma.clientProfile.findFirst({
        where: {
          email: lead.email,
        },
      })

    if (existingClient) {
      return NextResponse.json({
        ok: true,
        alreadyExists: true,
        client: existingClient,
      })
    }

    const client =
      await prisma.clientProfile.create({
        data: {
          name: lead.name,
          email: lead.email,
          type: "client",
          status: "active",
          source: "creator-lead",
          interests: lead.creatorType || null,
          notes: lead.notes || null,
          tags: lead.niche || null,
        },
      })

    return NextResponse.json({
      ok: true,
      client,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Client conversion failed",
      },
      { status: 500 }
    )
  }
}