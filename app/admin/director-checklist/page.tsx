import Link from "next/link"
import { connection } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildDirectorChecklist } from "../../../lib/publishing/director-checklist"
import {
  attachDirectorMonitoring,
  type DirectorMonitoringStatus,
} from "../../../lib/publishing/director-checklist-monitoring"
import { loadDirectorOperationalSignals } from "../../../lib/publishing/director-checklist-signals"
import { buildMultimediaPackageReadiness } from "../../../lib/publishing/multimedia-package-readiness"
import { latestDistributionScope } from "../../../lib/publishing/distribution-scope"
import { computeArticleAuditFingerprint } from "../../../lib/research/article-audit-fingerprint"

function monitoringColor(status: DirectorMonitoringStatus) {
  switch (status) {
    case "Success":
      return "#15803d"
    case "Pending":
      return "#b45309"
    case "Failed":
      return "#b91c1c"
    case "Blocked":
      return "#9f1239"
    case "Unavailable":
      return "#6b7280"
    default:
      return "#7c3aed"
  }
}

export default async function DirectorChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ articleId?: string }>
}) {
  await connection()

  const { articleId: articleIdParam } = await searchParams
  const articleId = articleIdParam?.trim() || null

  const articles = await prisma.article.findMany({
    where: articleId ? { id: articleId } : undefined,
    include: {
      researchAudits: { orderBy: { createdAt: "desc" } },
      researchSources: true,
      reviewNotes: true,
      socialPosts: {
        select: {
          id: true,
          platform: true,
          status: true,
          publishedAt: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: articleId ? 1 : 25,
  })

  const views = []
  for (const article of articles) {
    const checklist = buildDirectorChecklist(article)
    const signals = await loadDirectorOperationalSignals({
      articleId: article.id,
      socialPostIds: article.socialPosts.map((post) => post.id),
    })
    const monitored = attachDirectorMonitoring(checklist, article, signals)

    let packageReadiness = null
    if (articleId) {
      const full = await prisma.article.findUnique({
        where: { id: article.id },
        include: {
          researchSources: true,
          researchAudits: { orderBy: { createdAt: "desc" }, take: 1 },
          reviewNotes: true,
          socialPosts: true,
          newsletters: { orderBy: { updatedAt: "desc" }, take: 1 },
        },
      })
      if (full) {
        const sourceUrls = full.researchSources
          .map((s) => s.url)
          .filter((u): u is string => Boolean(u))
        const contentFingerprint = computeArticleAuditFingerprint(full, sourceUrls)
        const scope = latestDistributionScope(full.reviewNotes)
        const byPlatform = (platform: string) => {
          const posts = full.socialPosts.filter((p) => p.platform === platform)
          return (
            posts.find((p) => p.status === "approved") ?? posts[0] ?? null
          )
        }
        const x = byPlatform("twitter")
        const linkedin = byPlatform("linkedin")
        const threads = byPlatform("threads")
        const facebook = byPlatform("facebook")
        const newsletter = full.newsletters[0] ?? null
        const youtubePost = await prisma.youTubePost.findFirst({
          where: { articleId: full.id },
          orderBy: { updatedAt: "desc" },
        })
        packageReadiness = buildMultimediaPackageReadiness({
          article: full,
          contentFingerprint,
          evidenceSummary: {
            auditId: full.researchAudits[0]?.id ?? null,
            recommendation:
              full.researchAudits[0]?.publicationRecommendation ?? null,
            consensusScore: full.researchAudits[0]?.consensusScore ?? null,
            sourceQualityScore: full.researchAudits[0]?.sourceQualityScore ?? null,
          },
          xAnnouncement: x
            ? { id: x.id, content: x.content, status: x.status }
            : null,
          linkedinAnnouncement: linkedin
            ? {
                id: linkedin.id,
                content: linkedin.content,
                status: linkedin.status,
              }
            : null,
          threadsAnnouncement: threads
            ? {
                id: threads.id,
                content: threads.content,
                status: threads.status,
              }
            : null,
          facebookAnnouncement: facebook
            ? {
                id: facebook.id,
                content: facebook.content,
                status: facebook.status,
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
          youtubeAssets: youtubePost
            ? {
                youtubePostId: youtubePost.id,
                title: youtubePost.title,
                description: youtubePost.description,
                longFormReady: Boolean(youtubePost.renderedVideoUrl),
                shortsReady: Boolean(youtubePost.shortsVideoUrl),
              }
            : null,
        })
        void scope
      }
    }

    views.push({ ...monitored, packageReadiness })
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1>Director Checklist</h1>
          <p style={{ maxWidth: 780, color: "var(--muted)", lineHeight: 1.7 }}>
            One operating path with evidence-based monitoring: AI Generator →
            research → audit → human approval → featured image → publish /
            scheduler → social. Statuses are Success, Pending, Failed, Blocked,
            Unavailable, or Unknown — derived only from existing article, audit,
            approval, image, social, and operational-event records.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Link href="/admin/ai-generator" style={buttonStyle}>
            AI Generator
          </Link>
          <Link href="/admin/articles" style={secondaryButtonStyle}>
            Articles
          </Link>
          <Link href="/admin/social" style={secondaryButtonStyle}>
            Social
          </Link>
        </div>
      </div>

      {views.length === 0 ? (
        <section style={{ ...cardStyle, marginTop: 28 }}>
          <h2 style={{ marginTop: 0 }}>No articles</h2>
          <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
            {articleId
              ? "No article matched that id."
              : "Create the first article with the AI Generator, then return here for the checklist."}
          </p>
          <Link href="/admin/ai-generator" style={buttonStyle}>
            Open AI Generator
          </Link>
        </section>
      ) : (
        <section style={{ marginTop: 28, display: "grid", gap: 22 }}>
          {views.map((view) => (
            <article key={view.articleId} style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2 style={{ margin: "0 0 8px" }}>{view.title}</h2>
                  <p style={{ margin: 0, color: "var(--muted)" }}>
                    Status: {view.articleStatus} · /blog/{view.slug}
                  </p>
                  <p style={{ margin: "10px 0 0", color: "var(--muted)", fontSize: 14 }}>
                    Monitoring summary — Success {view.summary.Success}, Pending{" "}
                    {view.summary.Pending}, Failed {view.summary.Failed}, Blocked{" "}
                    {view.summary.Blocked}, Unavailable {view.summary.Unavailable},
                    Unknown {view.summary.Unknown}
                  </p>
                </div>
                {view.nextAction ? (
                  <Link href={view.nextAction.href} style={buttonStyle}>
                    Next: {view.nextAction.label} ({view.nextAction.monitoringStatus})
                  </Link>
                ) : (
                  <span style={{ color: "#15803d", fontWeight: 700 }}>
                    Checklist monitored complete
                  </span>
                )}
              </div>

              {view.packageReadiness ? (
                <div
                  style={{
                    marginTop: 18,
                    padding: 16,
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--background)",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>
                    Complete package review
                  </div>
                  <p style={{ margin: "0 0 10px", color: "var(--muted)", fontSize: 14 }}>
                    Approval: {view.packageReadiness.approvalState}
                    {view.packageReadiness.schedule
                      ? ` · Schedule: ${view.packageReadiness.schedule}`
                      : ""}
                    {view.packageReadiness.packageFingerprint
                      ? ` · FP: ${view.packageReadiness.packageFingerprint.slice(0, 12)}…`
                      : ""}
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                    {view.packageReadiness.rows.map((row) => (
                      <li key={row.channel}>
                        <strong>{row.channel}</strong>
                        {row.authorised ? " · authorised" : " · not authorised"}
                        {row.assetReady ? " · asset ready" : " · asset missing"}
                        {row.accountOrPage ? ` · ${row.accountOrPage}` : ""}
                        {row.blocker ? ` · blocker: ${row.blocker}` : ""}
                        {row.outcome ? ` · outcome: ${row.outcome}` : ""}
                      </li>
                    ))}
                  </ul>
                  {view.packageReadiness.socialCopy.x ||
                  view.packageReadiness.socialCopy.threads ||
                  view.packageReadiness.socialCopy.facebook ? (
                    <div style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
                      Exact social copy is bound in Social posts — open Social to
                      preview before I2 approval. YouTube long-form ready:{" "}
                      {view.packageReadiness.youtubePreview?.longFormReady
                        ? "yes"
                        : "no"}
                      ; Shorts ready:{" "}
                      {view.packageReadiness.youtubePreview?.shortsReady
                        ? "yes"
                        : "no"}
                      .
                    </div>
                  ) : null}
                </div>
              ) : null}

              <ol
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "22px 0 0",
                  display: "grid",
                  gap: 12,
                }}
              >
                {view.steps.map((step, index) => (
                  <li
                    key={step.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "32px 1fr auto",
                      gap: 12,
                      alignItems: "start",
                      padding: "12px 0",
                      borderTop: index === 0 ? "none" : "1px solid var(--border)",
                    }}
                  >
                    <span style={{ color: "var(--muted)", fontWeight: 700 }}>
                      {index + 1}.
                    </span>
                    <div>
                      <div style={{ fontWeight: 700 }}>{step.label}</div>
                      <div
                        style={{
                          color: "var(--muted)",
                          lineHeight: 1.6,
                          marginTop: 4,
                        }}
                      >
                        {step.monitoringDetail}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          color: monitoringColor(step.monitoringStatus),
                          fontWeight: 700,
                          marginBottom: 8,
                        }}
                      >
                        {step.monitoringStatus}
                      </div>
                      <Link href={step.href} style={linkStyle}>
                        Open workflow
                      </Link>
                    </div>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "12px 18px",
  borderRadius: 10,
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  fontWeight: "bold",
  textDecoration: "none",
}

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "var(--card-background)",
  color: "inherit",
  border: "1px solid var(--border)",
}

const cardStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const linkStyle: React.CSSProperties = {
  color: "inherit",
  fontWeight: 600,
}
