import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const [
    profiles,
    interactions,
    topicSignals,
    insights,
    subscribers,
  ] = await Promise.all([
    prisma.audienceProfile.findMany({
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    prisma.audienceInteraction.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.audienceTopicSignal.findMany({
      orderBy: { strength: "desc" },
      take: 100,
    }),
    prisma.communityInsightRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ])

  return NextResponse.json({
    ok: true,
    profiles,
    interactions,
    topicSignals,
    insights,
    subscribers,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const profile = await prisma.audienceProfile.create({
      data: {
        email: body.email || null,
        name: body.name || null,
        source: body.source || "website",
        audienceType: body.audienceType || "creator",
        relationshipStage: body.relationshipStage || "subscriber",
        trustScore: body.trustScore || 60,
        engagementScore: body.engagementScore || 60,
        resonanceScore: body.resonanceScore || 60,
        tags: body.tags || [],
        interests: body.interests || [],
        metadata: body.metadata || {},
      },
    })

    return NextResponse.json({
      ok: true,
      profile,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        ok: false,
        error: "Audience profile creation failed",
      },
      { status: 500 }
    )
  }
}