import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"

type GrowthMetrics = {
  totalSubscribers: number
  activeSubscribers: number
  monthlySubscribers: number
  growthRate: number
}

type GrowthIntelligence = {
  growthScore: number
  status: string
  momentum: string
  summary: string
  strengths: string[]
  risks: string[]
  opportunities: string[]
  recommendations: string[]
}

function buildFallbackIntelligence(metrics: GrowthMetrics): GrowthIntelligence {
  const { totalSubscribers, activeSubscribers, monthlySubscribers } = metrics

  const strengths = ["Automation infrastructure is operational"]
  if (monthlySubscribers > 0) {
    strengths.unshift("Subscribers are growing this month")
  }

  const risks: string[] = []
  if (totalSubscribers < 50) {
    risks.push("Subscriber base remains very small")
  }
  if (activeSubscribers < totalSubscribers) {
    risks.push("Some subscribers are inactive or unsubscribed")
  }

  return {
    growthScore: totalSubscribers >= 25 ? 45 : 35,
    status: "Early Stage",
    momentum: monthlySubscribers > 0 ? "Growing" : "Establishing Baseline",
    summary:
      "Echoes & Visions has subscriber tracking and growth tooling in place, but audience size is still early. Focus on consistent publishing and lead magnets to build momentum.",
    strengths,
    risks,
    opportunities: [
      "Lead magnets",
      "Newsletter promotion",
      "SEO growth",
    ],
    recommendations: [
      "Publish consistently",
      "Add lead magnets",
      "Improve subscriber acquisition",
    ],
  }
}

function computeMetrics(subscribers: { status: string; createdAt: Date }[]) {
  const totalSubscribers = subscribers.length
  const activeSubscribers = subscribers.filter(
    (subscriber) => subscriber.status === "active"
  ).length

  const now = new Date()
  const monthlySubscribers = subscribers.filter((subscriber) => {
    const createdAt = new Date(subscriber.createdAt)
    return (
      createdAt.getMonth() === now.getMonth() &&
      createdAt.getFullYear() === now.getFullYear()
    )
  }).length

  const growthRate =
    totalSubscribers > 0
      ? Math.round((monthlySubscribers / totalSubscribers) * 100)
      : 0

  return {
    totalSubscribers,
    activeSubscribers,
    monthlySubscribers,
    growthRate,
  }
}

export async function GET() {
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { createdAt: "asc" },
  })

  const metrics = computeMetrics(subscribers)
  let intelligence = buildFallbackIntelligence(metrics)

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a subscriber growth analyst for Echoes & Visions. Be honest, practical, and concise. This is an early-stage platform, so do not punish low subscriber count too harshly. Never invent statistics. Return valid JSON only.",
        },
        {
          role: "user",
          content: `
Analyze these subscriber metrics and return JSON.

Metrics:
${JSON.stringify(metrics, null, 2)}

Scoring guidance:
- 0-30 = very early audience
- 31-55 = early but functional
- 56-75 = growing audience with clear next steps
- 76-100 = strong subscriber traction

Return exactly:

{
  "growthScore": 0,
  "status": "Early Stage",
  "momentum": "Establishing Baseline",
  "summary": "...",
  "strengths": ["..."],
  "risks": ["..."],
  "opportunities": ["..."],
  "recommendations": ["..."]
}

For status use one of: Early Stage, Building, Growing, Scaling.
For momentum use one of: Establishing Baseline, Growing, Stable, Declining, Insufficient Data.
`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content || "{}"
    const cleaned = raw.replace(/```json|```/g, "").trim()
    const parsed = JSON.parse(cleaned)

    intelligence = {
      growthScore: Math.max(
        Number(parsed.growthScore ?? intelligence.growthScore),
        metrics.totalSubscribers > 0 ? 35 : 10
      ),
      status: typeof parsed.status === "string" ? parsed.status : intelligence.status,
      momentum:
        typeof parsed.momentum === "string"
          ? parsed.momentum
          : intelligence.momentum,
      summary:
        typeof parsed.summary === "string"
          ? parsed.summary
          : intelligence.summary,
      strengths: Array.isArray(parsed.strengths)
        ? parsed.strengths
        : intelligence.strengths,
      risks: Array.isArray(parsed.risks) ? parsed.risks : intelligence.risks,
      opportunities: Array.isArray(parsed.opportunities)
        ? parsed.opportunities
        : intelligence.opportunities,
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : intelligence.recommendations,
    }
  } catch (error) {
    console.error("Growth intelligence OpenAI failed, using fallback:", error)
  }

  return NextResponse.json({
    ok: true,
    metrics,
    intelligence,
  })
}
