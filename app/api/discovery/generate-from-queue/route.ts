import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  privilegedSameOriginHeaders,
  requireEditorAuth,
} from "../../../../lib/publishing/require-editor-auth"
import {
  trustedInternalUrl,
  trustedOriginUnavailableResponse,
} from "../../../../lib/publishing/trusted-internal-origin"

export async function POST(request: Request) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const generateUrl = trustedInternalUrl("/api/ai/generate-article")
  if (!generateUrl) return trustedOriginUnavailableResponse()

  try {
    const body = await request.json().catch(() => ({}))
    const topicId = body.topicId as string | undefined

    const topic = topicId
      ? await prisma.discoveredTopic.findUnique({
          where: { id: topicId },
        })
      : await prisma.discoveredTopic.findFirst({
          where: {
            status: "discovered",
          },
          orderBy: {
            opportunityScore: "desc",
          },
        })

    if (!topic) {
      return NextResponse.json(
        {
          ok: false,
          error: "No discovered topic found in queue",
        },
        { status: 404 }
      )
    }

    await prisma.discoveredTopic.update({
      where: { id: topic.id },
      data: {
        status: "researching",
      },
    })

    const response = await fetch(generateUrl, {
      method: "POST",
      headers: privilegedSameOriginHeaders(request),
      body: JSON.stringify({
        topic: topic.title,
        category: topic.category,
      }),
    })

    const articleResult = await response.json()

    if (!response.ok || !articleResult?.ok) {
      await prisma.discoveredTopic.update({
        where: { id: topic.id },
        data: {
          status: "discovered",
        },
      })

      return NextResponse.json(
        {
          ok: false,
          topic,
          articleResult,
          error: "Article generation failed",
        },
        { status: 500 }
      )
    }

    const updatedTopic = await prisma.discoveredTopic.update({
      where: { id: topic.id },
      data: {
        status: "generated",
      },
    })

    return NextResponse.json({
      ok: true,
      topic: updatedTopic,
      article: articleResult.article,
      researchAudit: articleResult.researchAudit,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate article from queue",
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return POST(request)
}