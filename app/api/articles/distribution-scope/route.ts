import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePublishingEditor } from "../../../../lib/publishing/require-editor-auth"
import {
  bindDistributionScopeNote,
  buildPublicationPackage,
} from "../../../../lib/publishing/publication-package"
import {
  ORDINARY_WORK_ARTICLE_ID,
  type DistributionChannel,
} from "../../../../lib/publishing/distribution-scope"
import { computeArticleAuditFingerprint } from "../../../../lib/research/article-audit-fingerprint"

const ALLOWED: DistributionChannel[] = ["x", "newsletter"]

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
            "Ordinary Work distribution scope is fixed (X only). Do not add newsletter retrospectively.",
        },
        { status: 409 },
      )
    }

    const channelsRaw = Array.isArray(body?.channels) ? body.channels : []
    const channels = channelsRaw.filter(
      (c: unknown): c is DistributionChannel =>
        typeof c === "string" && ALLOWED.includes(c as DistributionChannel),
    )
    if (channels.length === 0) {
      return NextResponse.json(
        { ok: false, error: "At least one authorised channel is required." },
        { status: 400 },
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
          where: { platform: "twitter" },
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

    const sourceUrls = article.researchSources
      .map((s) => s.url)
      .filter((u): u is string => Boolean(u))
    const contentFingerprint = computeArticleAuditFingerprint(
      article,
      sourceUrls,
    )
    const latestAudit = article.researchAudits[0] ?? null
    const xPost =
      article.socialPosts.find((p) => p.status === "approved") ??
      article.socialPosts[0] ??
      null
    const newsletter = article.newsletters[0] ?? null

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
      newsletter: newsletter
        ? {
            id: newsletter.id,
            subject: newsletter.subject,
            previewText: newsletter.previewText,
            content: newsletter.content,
            status: newsletter.status,
          }
        : null,
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
