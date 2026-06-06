import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"

export async function POST(req: NextRequest) {
  try {
    const { articleId } = await req.json()

    const article = await prisma.article.findUnique({
      where: {
        id: articleId,
      },
    })

    if (!article) {
      return NextResponse.json(
        {
          ok: false,
          error: "Article not found",
        },
        { status: 404 }
      )
    }

    const completion =
      await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Return valid JSON only. Never fabricate facts.",
          },
          {
            role: "user",
            content: `
Generate a complete content package.

Title:
${article.title}

Content:
${article.content}

Return:

{
  "newsletterSubject": "...",
  "newsletterPreview": "...",
  "newsletterContent": "...",
  "twitterPost": "...",
  "linkedinPost": "...",
  "facebookPost": "..."
}
            `,
          },
        ],
      })

    const raw =
      completion.choices[0]?.message?.content || "{}"

    const packageData = JSON.parse(
      raw.replace(/```json|```/g, "").trim()
    )

    const newsletter = await prisma.newsletter.create({
      data: {
        articleId: article.id,
        subject: packageData.newsletterSubject,
        previewText: packageData.newsletterPreview,
        content: packageData.newsletterContent,
        status: "review-required",
      },
    })

    const socialPosts = await prisma.socialPost.createMany({
      data: [
        {
          articleId: article.id,
          platform: "twitter",
          content: packageData.twitterPost,
          status: "review-required",
        },
        {
          articleId: article.id,
          platform: "linkedin",
          content: packageData.linkedinPost,
          status: "review-required",
        },
        {
          articleId: article.id,
          platform: "facebook",
          content: packageData.facebookPost,
          status: "review-required",
        },
      ],
    })

    return NextResponse.json({
      ok: true,
      package: packageData,
      newsletter,
      socialPosts,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Package generation failed",
      },
      { status: 500 }
    )
  }
}