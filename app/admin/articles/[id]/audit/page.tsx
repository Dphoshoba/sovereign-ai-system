import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveArticleAuditState } from "../../../../../lib/research/current-article-audit";
import { ArticleAuditPanel } from "../../ArticleAuditPanel";

export default async function ArticleAuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      researchAudits: {
        orderBy: {
          createdAt: "desc",
        },
      },
      researchSources: true,
      reviewNotes: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
  if (!article) notFound();

  const { currentAudit, historicalAudits } = resolveArticleAuditState(article);

  return (
    <main style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <Link href="/admin/articles">Back to Articles</Link>
      <ArticleAuditPanel
        article={article}
        currentAudit={currentAudit}
        historicalAudits={historicalAudits}
      />
    </main>
  );
}
