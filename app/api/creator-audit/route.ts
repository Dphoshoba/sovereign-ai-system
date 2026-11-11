import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"
import { requireEditorAuth } from "../../../lib/publishing/require-editor-auth"
import {
  captureEmail,
  captureText,
  payloadWithinLimit,
  publicCaptureAllowed,
} from "../../../lib/security/public-capture"

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

export async function POST(request: Request) {
  if (!payloadWithinLimit(request) || !(await publicCaptureAllowed("creator-audit", request))) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 })
  }

  const auth = await requireEditorAuth()

  try {
    const body = await request.json()
    const name = captureText(body?.name, 120)
    const email = captureEmail(body?.email)
    const intake = {
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
    }

    if (!intake.name || !intake.email) {
      return NextResponse.json(
        { ok: false, error: "Name and email are required" },
        { status: 400 }
      )
    }

    if (!auth.ok) {
      const existing = await prisma.creatorAuditRequest.findFirst({
        where: { email: intake.email, status: "audit-requested" },
      })
      if (existing) return NextResponse.json({ ok: true })

      await prisma.creatorAuditRequest.create({
        data: {
          ...intake,
          name: intake.name,
          email: intake.email,
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
        JSON.stringify(intake) +
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
        ...intake,
        name: intake.name,
        email: intake.email,
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
        error: "Failed to create creator audit",
      },
      { status: 500 }
    )
  }
}