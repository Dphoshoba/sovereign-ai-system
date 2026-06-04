import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { encodingNormalizer } from "../research/encoding-normalizer"

export async function autoGenerateSocialPosts(articleId: string) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
  })

  if (!article) {
    return {
      ok: false,
      reason: "Article not found",
      posts: [],
    }
  }

  if (article.status !== "published") {
    return {
      ok: false,
      reason: "Article must be published before generating social posts",
      posts: [],
    }
  }

  const existingPosts = await prisma.socialPost.findMany({
    where: { articleId },
    select: { id: true },
  })

  if (existingPosts.length > 0) {
    return {
      ok: true,
      reason: "Social posts already exist for this article",
      posts: [],
    }
  }

  const response = await getOpenAI().responses.create({
    model: "gpt-5.2",
    instructions:
      "You create wise, clear, practical social media posts for Echoes & Visions. Return only valid JSON. No markdown wrapper. No emojis. No hype.",
    input:
      `Create social media drafts for this published article.\n\n` +
      `Tone: wise, clear, human, practical, calm, founder-level.\n` +
      `Do not use emojis. Do not use hype. Do not invent facts.\n\n` +
      `Article title:\n${article.title}\n\n` +
      `Article excerpt:\n${article.excerpt || ""}\n\n` +
      `Return JSON exactly like this:\n` +
      `{"twitter":"...","linkedin":"...","threads":"..."}`,
  })

  const parsed = JSON.parse(response.output_text)

  const twitterContent = parsed.twitter
    ? encodingNormalizer(parsed.twitter).slice(0, 280)
    : ""

  const linkedinContent = parsed.linkedin
    ? encodingNormalizer(parsed.linkedin)
    : ""

  const threadsContent = parsed.threads
    ? encodingNormalizer(parsed.threads)
    : ""

  const posts = await Promise.all([
    prisma.socialPost.create({
      data: {
        articleId: article.id,
        platform: "twitter",
        content: twitterContent,
        status: "review-required",
      },
    }),
    prisma.socialPost.create({
      data: {
        articleId: article.id,
        platform: "linkedin",
        content: linkedinContent,
        status: "review-required",
      },
    }),
    prisma.socialPost.create({
      data: {
        articleId: article.id,
        platform: "threads",
        content: threadsContent,
        status: "review-required",
      },
    }),
  ])

  return {
    ok: true,
    reason: "Social posts generated",
    posts,
  }
}
