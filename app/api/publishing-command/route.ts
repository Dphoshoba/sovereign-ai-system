import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

async function seedCadenceGoals() {
  const existing = await prisma.publishingCadenceGoal.findMany()

  if (existing.length === 0) {
    await prisma.publishingCadenceGoal.createMany({
      data: [
        {
          title: "Daily YouTube Short",
          channel: "youtube",
          goalType: "short",
          target: 7,
          period: "weekly",
        },
        {
          title: "Weekly Long-form Videos",
          channel: "youtube",
          goalType: "long-form",
          target: 2,
          period: "weekly",
        },
        {
          title: "Weekly Newsletter",
          channel: "email",
          goalType: "newsletter",
          target: 1,
          period: "weekly",
        },
        {
          title: "Monthly Lead Magnet",
          channel: "owned-audience",
          goalType: "lead-magnet",
          target: 1,
          period: "monthly",
        },
      ],
    })
  }
}

export async function GET() {
  await seedCadenceGoals()

  const [goals, items, assets, runs, events, subscribers] = await Promise.all([
    prisma.publishingCadenceGoal.findMany({
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
    prisma.contentOperatingItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.youTubePublishingAsset.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.youTubeIntelligenceRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.publishingWorkflowEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 150,
    }),
    prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ])

  return NextResponse.json({
    ok: true,
    goals,
    items,
    assets,
    runs,
    events,
    subscribers,
  })
}

export async function POST(request: Request) {
  try {
    await seedCadenceGoals()

    const body = await request.json().catch(() => ({}))

    const [
      contentItems,
      assets,
      subscribers,
      semanticRecords,
      graphNodes,
      reasoningRuns,
      worldRuns,
    ] = await Promise.all([
      prisma.contentOperatingItem.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.youTubePublishingAsset.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.newsletterSubscriber.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.semanticKnowledgeRecord.findMany({
        orderBy: { importance: "desc" },
        take: 120,
      }),
      prisma.knowledgeGraphNode.findMany({
        orderBy: { importance: "desc" },
        take: 100,
      }),
      prisma.reasoningSimulationRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.worldModelV2Run.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
      }).catch(() => []),
    ])

    const promptTopic =
      body.topic ||
      "Create a YouTube-led content plan for Echoes & Visions Sovereign Intelligence Platform."

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Echoes & Visions Publishing Command Center and YouTube Intelligence Runtime. " +
        DAVID_WRITING_DNA +
        " Protect cadence. Keep the ecosystem focused. Generate practical YouTube, newsletter, lead magnet, and owned-audience assets. Return valid JSON only.",
      input:
        "Generate a publishing intelligence run.\n\n" +
        `Topic: ${promptTopic}\n\n` +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "cadenceScore":75,
          "focusScore":80,
          "audienceFitScore":82,
          "funnelScore":78,
          "findings":{
            "cadenceRisks":["..."],
            "bestTopics":["..."],
            "youtubeAngles":["..."],
            "newsletterAngles":["..."],
            "leadMagnetIdeas":["..."],
            "nextPublishingMoves":["..."]
          },
          "assets":[
            {
              "title":"...",
              "assetType":"short|long-form|newsletter|lead-magnet|thumbnail|community-post",
              "status":"idea",
              "hook":"...",
              "script":"...",
              "description":"...",
              "thumbnailIdea":"...",
              "cta":"...",
              "pillar":"AI Sovereign Systems|Creator Intelligence|Ministry Intelligence|Strategic Foresight",
              "score":80,
              "metadata":{}
            }
          ]
        }` +
        "\n\nContent Items:\n" + JSON.stringify(contentItems) +
        "\n\nPublishing Assets:\n" + JSON.stringify(assets) +
        "\n\nSubscribers:\n" + JSON.stringify(subscribers) +
        "\n\nSemantic Records:\n" + JSON.stringify(semanticRecords) +
        "\n\nGraph Nodes:\n" + JSON.stringify(graphNodes) +
        "\n\nReasoning Runs:\n" + JSON.stringify(reasoningRuns) +
        "\n\nWorld Model V2 Runs:\n" + JSON.stringify(worldRuns),
    })

    const parsed = JSON.parse(response.output_text)

    const run = await prisma.youTubeIntelligenceRun.create({
      data: {
        title: parsed.title || "Publishing Intelligence Run",
        summary: parsed.summary || null,
        cadenceScore: parsed.cadenceScore || 70,
        focusScore: parsed.focusScore || 70,
        audienceFitScore: parsed.audienceFitScore || 70,
        funnelScore: parsed.funnelScore || 70,
        findings: parsed.findings || {},
        status: "completed",
      },
    })

    const savedAssets = []

    for (const item of parsed.assets || []) {
      const asset = await prisma.youTubePublishingAsset.create({
        data: {
          title: item.title,
          assetType: item.assetType || "short",
          status: item.status || "idea",
          hook: item.hook || null,
          script: item.script || null,
          description: item.description || null,
          thumbnailIdea: item.thumbnailIdea || null,
          cta:
            item.cta ||
            "Get the Sovereign AI Creator Blueprint at echoesandvisions.ai",
          pillar: item.pillar || "AI Sovereign Systems",
          score: item.score || 70,
          metadata: item.metadata || {},
        },
      })

      savedAssets.push(asset)

      await prisma.contentOperatingItem.create({
        data: {
          title: asset.title,
          contentType: asset.assetType,
          channel:
            asset.assetType === "newsletter"
              ? "email"
              : asset.assetType === "lead-magnet"
                ? "owned-audience"
                : "youtube",
          pillar: asset.pillar,
          status: "idea",
          priority: asset.score >= 80 ? "high" : "medium",
          hook: asset.hook,
          script: asset.script,
          description: asset.description,
          cta: asset.cta,
          tags: ["publishing-command", "echoes-visions"],
          metadata: {
            publishingAssetId: asset.id,
            runId: run.id,
          },
        },
      })
    }

    return NextResponse.json({
      ok: true,
      run,
      assets: savedAssets,
    })
  } catch (error) {
    console.error("Publishing command failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Publishing command failed",
      },
      { status: 500 }
    )
  }
}