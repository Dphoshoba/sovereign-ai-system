import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"
import { requireEditorAuth } from "../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const audits = await prisma.creatorAuditRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    return NextResponse.json({ ok: true, audits })
  } catch (error) {
    console.error("Creator audits fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch creator audits" },
      { status: 500 }
    )
  }
}

function captureText(value: unknown, max: number) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

function captureEmail(value: unknown) {
  const email = captureText(value, 200)?.toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

export async function POST(request: Request) {
  const auth = await requireEditorAuth()

  try {
    const body = await request.json()
    const name = captureText(body?.name, 120)
    const email = captureEmail(body?.email)

    if (!name || !email) {
      return NextResponse.json(
        { ok: false, error: "Name and email are required" },
        { status: 400 }
      )
    }

    if (!auth.ok) {
      await prisma.creatorAuditRequest.create({
        data: {
          name,
          email,
          creatorType: captureText(body?.creatorType, 160),
          niche: captureText(body?.niche, 160),
          audienceSize: captureText(body?.audienceSize, 80),
          publishingFrequency: captureText(body?.publishingFrequency, 80),
          monetizationMethod: captureText(body?.monetizationMethod, 160),
          currentTools: captureText(body?.currentTools, 240),
          biggestBottleneck: captureText(body?.biggestBottleneck, 500),
          automationGoals: captureText(body?.automationGoals, 500),
          status: "audit-requested",
        },
      })

      return NextResponse.json({ ok: true })
    }

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Creator Automation Audit Strategist for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Diagnose creator bottlenecks and recommend practical AI automation systems. Return only valid JSON.",
      input:
        "Analyze this creator audit request:\n\n" +
        JSON.stringify(body) +
        "\n\nReturn JSON only in this exact format:\n" +
        `{
          "opportunityScore": 75,
          "auditSummary": "...",
          "recommendedSystems": "...",
          "nextActions": "...",
          "proposalDraft": "..."
        }`,
    })

    const parsed = JSON.parse(response.output_text)

    const audit = await prisma.creatorAuditRequest.create({
      data: {
        name,
        email,
        creatorType: body.creatorType || null,
        niche: body.niche || null,
        audienceSize: body.audienceSize || null,
        publishingFrequency: body.publishingFrequency || null,
        monetizationMethod: body.monetizationMethod || null,
        currentTools: body.currentTools || null,
        biggestBottleneck: body.biggestBottleneck || null,
        automationGoals: body.automationGoals || null,
        status: "audit-requested",
        opportunityScore:
          typeof parsed.opportunityScore === "number"
            ? parsed.opportunityScore
            : 50,
        auditSummary: parsed.auditSummary || null,
        recommendedSystems: parsed.recommendedSystems || null,
        nextActions: parsed.nextActions || null,
        proposalDraft: parsed.proposalDraft || null,
      },
    })

    return NextResponse.json({ ok: true, audit })
  } catch (error) {
    console.error("Creator audit failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create creator audit",
      },
      { status: 500 }
    )
  }
}