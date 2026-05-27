import { NextRequest, NextResponse } from "next/server"

const trendDatabase = [
  {
    topic: "AI Automation for Churches",
    score: 91,
    category: "Ministry AI",
    reason: "High search growth + low competition.",
  },
  {
    topic: "AI Tools for Content Creators",
    score: 95,
    category: "Creator Economy",
    reason: "Explosive creator demand and Shorts potential.",
  },
  {
    topic: "How AI Saves Small Businesses Time",
    score: 89,
    category: "Business Automation",
    reason: "Strong practical value and broad audience.",
  },
  {
    topic: "Christian Creators Using AI",
    score: 87,
    category: "Faith + AI",
    reason: "Underserved niche with rising curiosity.",
  },
  {
    topic: "AI Workflow Systems",
    score: 94,
    category: "Productivity",
    reason: "High retention educational content.",
  },
]

function generateContentAngles(topic: string) {
  return [
    `Why ${topic} Is Exploding Right Now`,
    `Most People Use ${topic} Wrong`,
    `The Future of ${topic}`,
    `How Beginners Can Master ${topic}`,
    `${topic} Secrets Nobody Talks About`,
  ]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const niche =
      body?.niche || "AI Automation"

    const filteredTrends =
      trendDatabase.filter((trend) =>
        trend.category
          .toLowerCase()
          .includes(niche.toLowerCase()) ||
        trend.topic
          .toLowerCase()
          .includes(niche.toLowerCase())
      )

    const rankedTrends =
      filteredTrends.length > 0
        ? filteredTrends
        : trendDatabase

    const enriched = rankedTrends.map(
      (trend) => ({
        ...trend,
        angles:
          generateContentAngles(
            trend.topic
          ),
      })
    )

    return NextResponse.json({
      ok: true,
      niche,
      trends: enriched.sort(
        (a, b) => b.score - a.score
      ),
    })
  } catch (error) {
    console.error(
      "Trend discovery failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Trend discovery failed",
      },
      {
        status: 500,
      }
    )
  }
}