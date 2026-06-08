import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const leads = await prisma.creatorLead.findMany({
      orderBy: {
        leadScore: "desc",
      },
    })

    const intelligence = leads.map((lead) => {
      const score = lead.leadScore ?? 50

      let priority = "Low"
      let estimatedValue = 500
      let recommendation = "Send nurture email"

      if (score >= 80) {
        priority = "Hot"
        estimatedValue = 5000
        recommendation = "Book strategy session"
      } else if (score >= 60) {
        priority = "Warm"
        estimatedValue = 2500
        recommendation = "Send consultation invitation"
      }

      return {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        score,
        priority,
        estimatedValue,
        recommendation,
        creatorType: lead.creatorType,
        readiness: lead.readiness,
      }
    })

    return NextResponse.json({
      ok: true,
      intelligence,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate lead intelligence",
      },
      { status: 500 }
    )
  }
}
