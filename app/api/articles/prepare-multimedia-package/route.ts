import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePublishingEditor } from "../../../../lib/publishing/require-editor-auth"
import {
  LIVING_BEYOND_ARTICLE_ID,
  ORDINARY_WORK_ARTICLE_ID,
  isDistributionChannel,
  type DistributionChannel,
} from "../../../../lib/publishing/distribution-scope"
import { prepareMultimediaPackageForI2 } from "../../../../lib/publishing/prepare-multimedia-package"
import { computeArticleAuditFingerprint } from "../../../../lib/research/article-audit-fingerprint"

/**
 * Pre-I2 autonomous package preparation entrypoint.
 * Does not bind scope, publish, or upload. Editor auth required.
 */
export async function POST(req: NextRequest) {
  const auth = await requirePublishingEditor()
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()
    const articleId = body?.articleId
    if (!articleId || typeof articleId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing articleId" },
        { status: 400 },
      )
    }

    if (
      articleId === ORDINARY_WORK_ARTICLE_ID ||
      articleId === LIVING_BEYOND_ARTICLE_ID
    ) {
      return NextResponse.json(
        {
          ok: false,
          code: "protected_package",
          error:
            "Ordinary Work and Living Beyond packages must not be re-prepared or expanded.",
        },
        { status: 409 },
      )
    }

    const channelsRaw = Array.isArray(body?.channels) ? body.channels : []
    const channels = channelsRaw.filter(
      (c: unknown): c is DistributionChannel =>
        typeof c === "string" && isDistributionChannel(c),
    )
    if (channels.length === 0) {
      return NextResponse.json(
        { ok: false, error: "At least one channel is required." },
        { status: 400 },
      )
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        reviewNotes: true,
        researchSources: true,
        researchAudits: { orderBy: { createdAt: "desc" }, take: 1 },
        socialPosts: true,
        newsletters: { orderBy: { updatedAt: "desc" }, take: 1 },
      },
    })
    if (!article) {
      return NextResponse.json(
        { ok: false, error: "Article not found" },
        { status: 404 },
      )
    }

    const youtubePost = await prisma.youTubePost.findFirst({
      where: { articleId },
      orderBy: { updatedAt: "desc" },
    })

    const byPlatform = (platform: string) => {
      const posts = article.socialPosts.filter((p) => p.platform === platform)
      return posts.find((p) => p.status === "approved") ?? posts[0] ?? null
    }

    const sourceUrls = article.researchSources
      .map((s) => s.url)
      .filter((u): u is string => Boolean(u))
    const contentFingerprint = computeArticleAuditFingerprint(article, sourceUrls)
    const latestAudit = article.researchAudits[0] ?? null
    const newsletter = article.newsletters[0] ?? null

    const toAnn = (p: { id: string; content: string; status: string } | null) =>
      p ? { id: p.id, content: p.content, status: p.status } : null

    const result = await prepareMultimediaPackageForI2({
      articleId,
      actor: auth.actor,
      requestedChannels: channels,
      snapshot: {
        article,
        contentFingerprint,
        evidenceSummary: {
          auditId: latestAudit?.id ?? null,
          recommendation: latestAudit?.publicationRecommendation ?? null,
          consensusScore: latestAudit?.consensusScore ?? null,
          sourceQualityScore: latestAudit?.sourceQualityScore ?? null,
        },
        requestedChannels: channels,
        xAnnouncement: toAnn(byPlatform("twitter")),
        linkedinAnnouncement: toAnn(byPlatform("linkedin")),
        threadsAnnouncement: toAnn(byPlatform("threads")),
        facebookAnnouncement: toAnn(byPlatform("facebook")),
        newsletter: newsletter
          ? {
              id: newsletter.id,
              subject: newsletter.subject,
              previewText: newsletter.previewText,
              content: newsletter.content,
              status: newsletter.status,
            }
          : null,
        youtubeAssets: youtubePost
          ? {
              youtubePostId: youtubePost.id,
              title: youtubePost.title,
              description: youtubePost.description,
              longFormReady: Boolean(youtubePost.renderedVideoUrl),
              shortsReady: Boolean(youtubePost.shortsVideoUrl),
              longFormVideoSha256: null,
              shortsVideoSha256: null,
            }
          : null,
      },
      deps: {
        recordNote: async ({ articleId: id, action, note, actor }) => {
          await prisma.articleReviewNote.create({
            data: {
              articleId: id,
              action,
              note,
              reviewer: actor,
            },
          })
        },
      },
    })

    return NextResponse.json({
      ok: true,
      ...result,
      guidance: {
        next: "Director I2 review of exact assets, then bind distribution-scope",
        youtubePrep:
          "When youtube/youtube-shorts selected, complete local render pipelines before I2 so reviewable video files exist. Fixture demos are not cinematic production.",
        socialPrep:
          "Use /api/social/generate (now includes facebook) and newsletter generate routes to create reviewable drafts before approval.",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to prepare multimedia package",
      },
      { status: 500 },
    )
  }
}
