import Link from "next/link"
import type { CSSProperties } from "react"
import { connection } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  buildDirectorDecisionQueue,
  groupDirectorDecisionQueue,
  type DirectorQueueBucket,
} from "../../../lib/publishing/director-decision-queue"
import { ArticleReviewActions } from "../articles/ArticleReviewActions"
import { PrepareForReviewButton } from "../articles/PrepareForReviewButton"
import { ScheduleArticleButton } from "../articles/ScheduleArticleButton"

export const dynamic = "force-dynamic"

const BUCKET_LABELS: Record<DirectorQueueBucket, string> = {
  suggested: "Suggested / other",
  preparing: "Being prepared",
  review_ready: "Review-ready",
  hold: "On HOLD",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  failed: "Failed / rejected",
}

const BUCKET_ORDER: DirectorQueueBucket[] = [
  "hold",
  "review_ready",
  "preparing",
  "approved",
  "scheduled",
  "published",
  "failed",
  "suggested",
]

export default async function DirectorDecisionBoardPage() {
  await connection()

  const articles = await prisma.article.findMany({
    include: {
      researchAudits: { orderBy: { createdAt: "desc" }, take: 1 },
      reviewNotes: { orderBy: { createdAt: "desc" }, take: 8 },
      socialPosts: {
        select: { id: true, platform: true, status: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 40,
  })

  const items = buildDirectorDecisionQueue(articles)
  const groups = groupDirectorDecisionQueue(items)

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>Director Decision Board</h1>
          <p style={{ maxWidth: 820, color: "var(--muted)", lineHeight: 1.7 }}>
            Unified editorial authority surface. Suggest or prepare articles,
            review evidence, approve or reject, then let the platform complete
            authorised image, calendar, publish-due, and dual-gated social
            steps. Checklist monitoring remains available for evidence detail.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/admin/ai-generator" style={primaryButton}>
            Prepare for Director Review
          </Link>
          <Link href="/admin/discovery" style={secondaryButton}>
            Suggest topics
          </Link>
          <Link href="/admin/director-checklist" style={secondaryButton}>
            Checklist monitoring
          </Link>
          <Link href="/admin/social" style={secondaryButton}>
            Social approvals
          </Link>
        </div>
      </div>

      {BUCKET_ORDER.map((bucket) => {
        const rows = groups[bucket]
        if (!rows.length) return null
        return (
          <section key={bucket} style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>
              {BUCKET_LABELS[bucket]}{" "}
              <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                ({rows.length})
              </span>
            </h2>
            <div style={{ display: "grid", gap: 14 }}>
              {rows.map((item) => (
                <article key={item.articleId} style={cardStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: "0 0 6px" }}>
                        <Link href={item.href}>{item.title}</Link>
                      </h3>
                      <p style={{ margin: 0, color: "var(--muted)" }}>
                        {item.status} · {item.category}
                        {item.auditSummary ? ` · ${item.auditSummary}` : ""}
                        {item.featuredImage ? " · image ready" : " · image pending"}
                        {item.socialDraftCount
                          ? ` · ${item.socialDraftCount} social draft(s)`
                          : ""}
                      </p>
                      {item.holdReason && (
                        <p style={{ margin: "8px 0 0", color: "#9f1239" }}>
                          HOLD: {item.holdReason}
                        </p>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        alignItems: "flex-start",
                      }}
                    >
                      {(item.bucket === "preparing" ||
                        item.bucket === "hold" ||
                        item.bucket === "review_ready") && (
                        <PrepareForReviewButton articleId={item.articleId} />
                      )}
                      {item.bucket === "review_ready" && (
                        <ArticleReviewActions articleId={item.articleId} />
                      )}
                      {(item.bucket === "approved" ||
                        item.bucket === "scheduled") && (
                        <ScheduleArticleButton articleId={item.articleId} />
                      )}
                      <Link href={item.href} style={secondaryButton}>
                        Open
                      </Link>
                      <Link
                        href={`/admin/director-checklist?articleId=${item.articleId}`}
                        style={secondaryButton}
                      >
                        Checklist
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )
      })}

      {items.length === 0 && (
        <section style={{ ...cardStyle, marginTop: 28 }}>
          <h2 style={{ marginTop: 0 }}>No articles in queue</h2>
          <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
            Use Prepare for Director Review to create the first review package.
          </p>
        </section>
      )}
    </main>
  )
}

const primaryButton: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  textDecoration: "none",
  fontWeight: "bold",
}

const secondaryButton: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  color: "inherit",
  textDecoration: "none",
}

const sectionStyle: CSSProperties = {
  marginTop: 28,
}

const cardStyle: CSSProperties = {
  padding: 18,
  borderRadius: 14,
  border: "1px solid var(--border)",
  background: "var(--card-background)",
}
