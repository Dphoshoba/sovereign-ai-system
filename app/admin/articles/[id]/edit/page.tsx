import { notFound } from "next/navigation"
import { connection } from "next/server"
import { prisma } from "@/lib/prisma"
import { instantToAdelaideWallClock } from "../../../../../lib/publishing/adelaide-time"
import { resolveArticleAuditState } from "../../../../../lib/research/current-article-audit"
import { EditArticleForm } from "./EditArticleForm"

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()

  const { id } = await params
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      researchAudits: {
        orderBy: { createdAt: "desc" },
      },
      researchSources: true,
      reviewNotes: true,
    },
  })
  if (!article) notFound()

  const { currentAudit, historicalAudits } = resolveArticleAuditState(article)

  return (
    <EditArticleForm
      initialArticle={{
        id: article.id,
        title: article.title,
        slug: article.slug,
        category: article.category,
        excerpt: article.excerpt,
        content: article.content,
        featuredImage: article.featuredImage,
        seoTitle: article.seoTitle,
        seoDescription: article.seoDescription,
        seoKeywords: article.seoKeywords,
        scheduledFor: article.scheduledFor
          ? instantToAdelaideWallClock(article.scheduledFor)
          : null,
        status: article.status,
        approvedAt: article.approvedAt
          ? article.approvedAt.toISOString()
          : null,
        approvedBy: article.approvedBy,
        editorialScore: article.editorialScore,
        editorialGrade: article.editorialGrade,
        editorialWarnings: article.editorialWarnings,
        qualityScore: article.qualityScore,
        qualityGrade: article.qualityGrade,
        seoScore: article.seoScore,
        seoGrade: article.seoGrade,
      }}
      hasCurrentAudit={Boolean(currentAudit)}
      historicalAuditCount={historicalAudits.length}
    />
  )
}
