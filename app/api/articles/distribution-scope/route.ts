import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePublishingEditor } from "../../../../lib/publishing/require-editor-auth"
import {
  bindDistributionScopeNote,
  buildPublicationPackage,
} from "../../../../lib/publishing/publication-package"
import {
  DISTRIBUTION_CHANNELS,
  LIVING_BEYOND_ARTICLE_ID,
  LIVING_BEYOND_PROTECTED_CHANNELS,
  ORDINARY_WORK_ARTICLE_ID,
  isDistributionChannel,
  type DistributionChannel,
} from "../../../../lib/publishing/distribution-scope"
import { computeArticleAuditFingerprint } from "../../../../lib/research/article-audit-fingerprint"

const ALLOWED: DistributionChannel[] = [...DISTRIBUTION_CHANNELS]

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

    if (articleId === ORDINARY_WORK_ARTICLE_ID) {
      return NextResponse.json(
        {
          ok: false,
          code: "ordinary_work_protected",
          error:
            "Ordinary Work distribution scope is fixed (X only). Do not add newsletter, LinkedIn, or R4 channels retrospectively.",
        },
        { status: 409 },
      )
    }

    if (articleId === LIVING_BEYOND_ARTICLE_ID) {
      return NextResponse.json(
        {
          ok: false,
          code: "living_beyond_protected",
          error:
            "Living Beyond distribution scope is fixed (Website + X + newsletter + LinkedIn personal). Do not add Threads, Facebook, or YouTube until after its schedule window and Director authorisation.",
        },
        { status: 409 },
      )
    }

    const channelsRaw = Array.isArray(body?.channels) ? body.channels : []
    const channels = channelsRaw.filter(
      (c: unknown): c is DistributionChannel =>
        typeof c === "string" &&
        isDistributionChannel(c) &&
        ALLOWED.includes(c),
    )
    if (channels.length === 0) {
      return NextResponse.json(
        { ok: false, error: "At least one authorised channel is required." },
        { status: 400 },
      )
    }

    // Fail closed: never silently expand Living Beyond protected set if id changes form.
    if (
      articleId === LIVING_BEYOND_ARTICLE_ID &&
      channels.some((c) => !LIVING_BEYOND_PROTECTED_CHANNELS.includes(c))
    ) {
      return NextResponse.json(
        {
          ok: false,
          code: "living_beyond_protected",
          error: "Living Beyond may not receive R4 channel expansion.",
        },
        { status: 409 },
      )
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        reviewNotes: true,
        researchSources: true,
        researchAudits: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        socialPosts: {
          where: {
            platform: {
              in: ["twitter", "linkedin", "threads", "facebook"],
            },
          },
          orderBy: { updatedAt: "desc" },
        },
        newsletters: {
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
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

    const sourceUrls = article.researchSources
      .map((s) => s.url)
      .filter((u): u is string => Boolean(u))
    const contentFingerprint = computeArticleAuditFingerprint(
      article,
      sourceUrls,
    )
    const latestAudit = article.researchAudits[0] ?? null
    const twitterPosts = article.socialPosts.filter((p) => p.platform === "twitter")
    const linkedinPosts = article.socialPosts.filter(
      (p) => p.platform === "linkedin",
    )
    const threadsPosts = article.socialPosts.filter(
      (p) => p.platform === "threads",
    )
    const facebookPosts = article.socialPosts.filter(
      (p) => p.platform === "facebook",
    )
    const xPost =
      twitterPosts.find((p) => p.status === "approved") ??
      twitterPosts[0] ??
      null
    const linkedinPost =
      linkedinPosts.find((p) => p.status === "approved") ??
      linkedinPosts[0] ??
      null
    const threadsPost =
      threadsPosts.find((p) => p.status === "approved") ??
      threadsPosts[0] ??
      null
    const facebookPost =
      facebookPosts.find((p) => p.status === "approved") ??
      facebookPosts[0] ??
      null
    const newsletter = article.newsletters[0] ?? null

    const youtubeAssets = youtubePost
      ? {
          youtubePostId: youtubePost.id,
          title: youtubePost.title,
          description: youtubePost.description || "",
          longFormVideoSha256: null as string | null,
          shortsVideoSha256: null as string | null,
          thumbnailSha256: null as string | null,
          voiceoverSha256: null as string | null,
          longFormReady: Boolean(youtubePost.renderedVideoUrl),
          shortsReady: Boolean(youtubePost.shortsVideoUrl),
        }
      : null

    // Prefer exact binding hashes when a youtube-asset-bind note exists.
    const bindNote = article.reviewNotes
      .filter((n) => n.action === "youtube-asset-bind")
      .sort((a, b) => {
        const at = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bt - at
      })[0]
    if (bindNote?.note && youtubeAssets) {
      try {
        const parsed = JSON.parse(bindNote.note) as {
          longForm?: { videoSha256?: string }
          shorts?: { videoSha256?: string }
        }
        if (parsed.longForm?.videoSha256) {
          youtubeAssets.longFormVideoSha256 = parsed.longForm.videoSha256
          youtubeAssets.longFormReady = true
        }
        if (parsed.shorts?.videoSha256) {
          youtubeAssets.shortsVideoSha256 = parsed.shorts.videoSha256
          youtubeAssets.shortsReady = true
        }
      } catch {
        // ignore malformed bind notes
      }
    }

    // Allow clients to supply verified asset fingerprints at bind time.
    if (
      youtubeAssets &&
      body?.youtubeAssets &&
      typeof body.youtubeAssets === "object"
    ) {
      const ya = body.youtubeAssets as Record<string, unknown>
      if (typeof ya.longFormVideoSha256 === "string") {
        youtubeAssets.longFormVideoSha256 = ya.longFormVideoSha256
        youtubeAssets.longFormReady = true
      }
      if (typeof ya.shortsVideoSha256 === "string") {
        youtubeAssets.shortsVideoSha256 = ya.shortsVideoSha256
        youtubeAssets.shortsReady = true
      }
    }

    const pkg = buildPublicationPackage({
      article,
      contentFingerprint,
      evidenceSummary: {
        auditId: latestAudit?.id ?? null,
        recommendation: latestAudit?.publicationRecommendation ?? null,
        consensusScore: latestAudit?.consensusScore ?? null,
        sourceQualityScore: latestAudit?.sourceQualityScore ?? null,
      },
      xAnnouncement: xPost
        ? { id: xPost.id, content: xPost.content, status: xPost.status }
        : null,
      linkedinAnnouncement: linkedinPost
        ? {
            id: linkedinPost.id,
            content: linkedinPost.content,
            status: linkedinPost.status,
          }
        : null,
      threadsAnnouncement: threadsPost
        ? {
            id: threadsPost.id,
            content: threadsPost.content,
            status: threadsPost.status,
          }
        : null,
      facebookAnnouncement: facebookPost
        ? {
            id: facebookPost.id,
            content: facebookPost.content,
            status: facebookPost.status,
          }
        : null,
      newsletter: newsletter
        ? {
            id: newsletter.id,
            subject: newsletter.subject,
            previewText: newsletter.previewText,
            content: newsletter.content,
            status: newsletter.status,
          }
        : null,
      youtubeAssets,
      requestedChannels: channels,
    })

    if (!pkg.complete) {
      return NextResponse.json(
        {
          ok: false,
          code: "incomplete_package",
          error: "Publication package is incomplete for final channel binding.",
          missing: pkg.missing,
          packageFingerprint: pkg.packageFingerprint,
        },
        { status: 422 },
      )
    }

    const bound = bindDistributionScopeNote({
      articleId,
      channels,
      packageFingerprint: pkg.packageFingerprint,
      contentFingerprint,
      actor: auth.actor,
      note:
        typeof body?.note === "string" ? body.note : "Distribution scope bound",
    })

    await prisma.articleReviewNote.create({
      data: {
        articleId,
        action: bound.action,
        reviewer: auth.actor,
        note: bound.note,
      },
    })

    return NextResponse.json({
      ok: true,
      packageFingerprint: pkg.packageFingerprint,
      channels,
      bound: bound.payload,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to bind distribution scope",
      },
      { status: 500 },
    )
  }
}
