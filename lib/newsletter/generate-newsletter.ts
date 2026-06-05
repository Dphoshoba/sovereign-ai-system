import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { contentSafeNormalizer } from "../research/content-safe-normalizer"
import { encodingNormalizer } from "../research/encoding-normalizer"

export async function generateNewsletterForArticle(articleId: string) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
  })

  if (!article) {
    return {
      ok: false,
      reason: "Article not found",
      newsletter: null,
    }
  }

  if (article.status !== "published") {
    return {
      ok: false,
      reason: "Article must be published before generating a newsletter",
      newsletter: null,
    }
  }

  const existing = await prisma.newsletter.findFirst({
    where: { articleId },
  })

  if (existing) {
    return {
      ok: true,
      reason: "Newsletter already exists for this article",
      newsletter: existing,
    }
  }

  const response = await getOpenAI().responses.create({
    model: "gpt-5.2",
    instructions:
      "You write wise, clear, practical email newsletters for Echoes & Visions. Return only valid JSON. No markdown wrapper. No emojis. No hype.",
    input:
      `Create an email newsletter draft for this published article.\n\n` +
      `Tone: wise, clear, human, practical, calm, founder-level.\n` +
      `Do not invent facts. Do not use emojis.\n\n` +
      `Article title:\n${article.title}\n\n` +
      `Article excerpt:\n${article.excerpt || ""}\n\n` +
      `Article content:\n${article.content || ""}\n\n` +
      `Return JSON exactly like this:\n` +
      `{"subject":"...","previewText":"...","content":"..."}`,
  })

  const parsed = JSON.parse(response.output_text)

  const newsletter = await prisma.newsletter.create({
    data: {
      articleId: article.id,
      subject: encodingNormalizer(parsed.subject || article.title),
      previewText: parsed.previewText
        ? encodingNormalizer(parsed.previewText)
        : null,
      content: contentSafeNormalizer(parsed.content || ""),
      status: "review-required",
    },
  })

  return {
    ok: true,
    reason: "Newsletter generated",
    newsletter,
  }
}
