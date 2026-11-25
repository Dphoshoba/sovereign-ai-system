import {
  partitionAssociatedArticleAudits,
  type ArticleAuditAssociationNote,
  type AssociatedAudit,
} from "./article-audit-association"
import {
  type AuditableArticleState,
} from "./article-audit-fingerprint"
import {
  extractArticleSourceLinks,
  type StoredArticleSource,
} from "./article-source-links"

export type ArticleWithResearchAudits<TAudit extends AssociatedAudit> =
  AuditableArticleState & {
    id: string
    featuredImage?: string | null
    researchSources?: StoredArticleSource[] | null
    researchAudits: TAudit[]
    reviewNotes: ArticleAuditAssociationNote[]
  }

export function resolveArticleAuditState<TAudit extends AssociatedAudit>(
  article: ArticleWithResearchAudits<TAudit>,
): {
  currentAudit: TAudit | null
  historicalAudits: TAudit[]
  sourceUrls: string[]
} {
  const sources = extractArticleSourceLinks({
    content: article.content,
    excerpt: article.excerpt,
    featuredImage: article.featuredImage,
    researchSources: article.researchSources,
  })
  const sourceUrls = sources.map((source) => source.url)
  const { current, historical } = partitionAssociatedArticleAudits(
    article,
    sourceUrls,
    article.researchAudits,
    article.reviewNotes,
  )

  return {
    currentAudit: current,
    historicalAudits: historical,
    sourceUrls,
  }
}
