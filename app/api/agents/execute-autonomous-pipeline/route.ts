import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

import { directorAgent } from "../../../../lib/agents/director-agent"

import { autonomousPipelineAgent } from "../../../../lib/agents/autonomous-pipeline-agent"

import { executionTriggerAgent } from "../../../../lib/agents/execution-trigger-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const memories = await prisma.videoPerformanceMemory.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    const director = directorAgent({
      memories,

      audienceRegion: body.audienceRegion || "global",

      audienceType: body.audienceType || "faith-tech creators",

      contentType: body.contentType || "longform",

      predictionScores: body.predictionScores,
    })

    const pipeline = await autonomousPipelineAgent({
      directorDecision: director.directorDecision,
    })

    const execution = await executionTriggerAgent({
      executionPlan: pipeline.executionPlan,
    })

    return NextResponse.json({
      ok: true,
      director,
      pipeline,
      execution,
    })
  } catch (error) {
    console.error("Autonomous execution failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Autonomous execution failed",
      },
      {
        status: 500,
      }
    )
  }
}