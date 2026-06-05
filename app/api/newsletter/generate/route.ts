import { NextResponse } from "next/server"
import { generateNewsletterForArticle } from "../../../../lib/newsletter/generate-newsletter"

export async function POST(req: Request) {
  try {
    const { articleId } = await req.json()

    if (!articleId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing articleId",
        },
        { status: 400 }
      )
    }

    const result = await generateNewsletterForArticle(articleId)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Newsletter generation failed",
      },
      { status: 500 }
    )
  }
}
