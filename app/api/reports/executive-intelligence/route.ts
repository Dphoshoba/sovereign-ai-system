import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"

export async function GET() {
  try {
    const [articles, socialPosts, newsletters, subscribers, snapshots] =
      await Promise.all([
        prisma.article.findMany(),
        prisma.socialPost.findMany(),
        prisma.newsletter.findMany(),
        prisma.subscriber.findMany(),
        prisma.monthlySnapshot.findMany({
          orderBy: {
            month: "desc",
          },
          take: 2,
        }),
      ])

    const metrics = {
      articlesPublished: articles.filter((a) => a.status === "published").length,
      socialPostsPublished: socialPosts.filter((s) => s.status === "published").length,
      newslettersSent: newsletters.filter((n) => n.status === "sent").length,
      activeSubscribers: subscribers.filter((s) => s.status === "active").length,
      totalSubscribers: subscribers.length,
    }

    const trendContext = {
      currentSnapshot: snapshots[0] || null,
      previousSnapshot: snapshots[1] || null,
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are an executive growth analyst for Echoes & Visions. Score the platform based on maturity, operating readiness, consistency, distribution, audience traction, and growth momentum. This is an early-stage platform, so do not punish low subscriber count too severely. Be practical, honest, concise, and avoid hype. Return only valid JSON.",
        },
        {
          role: "user",
          content: `
Analyze these platform metrics and trend data.

Context:
Echoes & Visions is an early-stage AI publishing and audience platform. The system supports article publishing, social distribution, newsletter delivery, subscriber management, analytics, reporting, PDF exports, and monthly snapshots.

Metrics:
${JSON.stringify(metrics, null, 2)}

Trend Data:
${JSON.stringify(trendContext, null, 2)}

Analyze:
1. Current platform health
2. Growth momentum
3. Risks
4. Opportunities
5. Recommended next actions

Scoring guidance:
- 0-30 = weak or inactive platform
- 31-55 = early but functional
- 56-75 = operational with clear growth needs
- 76-90 = strong operating system with traction
- 91-100 = mature, scaled, high-performing platform

Return exactly:

{
  "growthScore": 0,
  "momentum": "Growing|Flat|Declining|Insufficient Data",
  "summary": "...",
  "strengths": ["..."],
  "risks": ["..."],
  "opportunities": ["..."],
  "recommendations": ["..."]
}
          `,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content || "{}"
    const cleaned = raw.replace(/```json|```/g, "").trim()
    const intelligence = JSON.parse(cleaned)

    if (
      trendContext.currentSnapshot &&
      !trendContext.previousSnapshot
    ) {
      intelligence.momentum = "Establishing Baseline"
    }

    if (
      trendContext.currentSnapshot &&
      trendContext.previousSnapshot
    ) {
      const current =
        trendContext.currentSnapshot

      const previous =
        trendContext.previousSnapshot

      const growthSignals = [
        current.articlesPublished >
          previous.articlesPublished,

        current.socialPublished >
          previous.socialPublished,

        current.newslettersSent >
          previous.newslettersSent,

        current.subscribers >
          previous.subscribers,
      ].filter(Boolean).length

      if (growthSignals >= 3) {
        intelligence.momentum = "Growing"
      } else if (growthSignals >= 1) {
        intelligence.momentum = "Stable"
      } else {
        intelligence.momentum = "Declining"
      }
    }

    const platformMaturityFloor =
      metrics.articlesPublished > 0 &&
      metrics.socialPostsPublished > 0 &&
      metrics.newslettersSent > 0 &&
      metrics.totalSubscribers > 0
        ? 60
        : 35

    intelligence.growthScore = Math.max(
      Number(intelligence.growthScore || 0),
      platformMaturityFloor
    )

    return NextResponse.json({
      ok: true,
      metrics,
      trendContext,
      intelligence,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Executive intelligence failed",
      },
      { status: 500 }
    )
  }
}