import { NextResponse } from "next/server"
import OpenAI from "openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function runAgent(name: string, role: string, input: string) {
  const response = await openai.responses.create({
    model: "gpt-5.2",
    instructions:
      `You are the ${name} for Echoes & Visions. ${role} ` +
      DAVID_WRITING_DNA +
      " Return clear, practical output. No fluff.",
    input,
  })

  return response.output_text
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const topic = body.topic || "AI automation for creators"

    const research = await runAgent(
      "Research Agent",
      "Find the core angles, audience needs, objections, and practical examples for the topic.",
      `Topic: ${topic}`
    )

    const seo = await runAgent(
      "SEO Agent",
      "Create SEO title, meta description, keywords, search intent, and internal-link opportunities.",
      `Topic: ${topic}\n\nResearch:\n${research}`
    )

    const editor = await runAgent(
      "Editor Agent",
      "Shape this into a strong article outline with David George's voice, practical sections, and a strong ending.",
      `Topic: ${topic}\n\nResearch:\n${research}\n\nSEO:\n${seo}`
    )

    const thumbnail = await runAgent(
      "Thumbnail Agent",
      "Create 5 high-CTR title options, thumbnail text, visual idea, emotion, and text-to-image prompt.",
      `Topic: ${topic}\n\nResearch:\n${research}\n\nSEO:\n${seo}\n\nOutline:\n${editor}`
    )

    const finalPlan = await runAgent(
      "Publishing Strategist",
      "Combine all agent outputs into one practical publishing plan.",
      `Topic: ${topic}

Research:
${research}

SEO:
${seo}

Article Outline:
${editor}

Thumbnail:
${thumbnail}

Return:
1. Best title
2. SEO title
3. Meta description
4. Keywords
5. Article outline
6. Thumbnail idea
7. Image prompt
8. Internal links
9. Publishing checklist`
    )

    return NextResponse.json({
      ok: true,
      workflow: {
        topic,
        research,
        seo,
        editor,
        thumbnail,
        finalPlan,
      },
    })
  } catch (error) {
    console.error("Multi-agent workflow failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to run multi-agent workflow",
      },
      { status: 500 }
    )
  }
}