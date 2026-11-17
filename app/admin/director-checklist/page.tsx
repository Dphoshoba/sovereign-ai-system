import Link from "next/link"
import { connection } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  buildDirectorChecklist,
  type DirectorChecklistStepState,
} from "../../../lib/publishing/director-checklist"

function stateColor(state: DirectorChecklistStepState) {
  switch (state) {
    case "complete":
      return "#15803d"
    case "action_required":
      return "#b45309"
    case "blocked":
      return "#b91c1c"
    default:
      return "#6b7280"
  }
}

function stateLabel(state: DirectorChecklistStepState) {
  switch (state) {
    case "complete":
      return "Complete"
    case "action_required":
      return "Action required"
    case "blocked":
      return "Blocked"
    default:
      return "Not started"
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

  const checklists = articles.map((article) => buildDirectorChecklist(article))

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1>Director Checklist</h1>
          <p style={{ maxWidth: 760, color: "var(--muted)", lineHeight: 1.7 }}>
            One operating path over existing workflows: AI Generator → research
            audit → human approval → featured image → publish → X social. Status
            is derived from article, audit, approval, image, and social records
            only.
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

      {checklists.length === 0 ? (
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
          {checklists.map((checklist) => (
            <article key={checklist.articleId} style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2 style={{ margin: "0 0 8px" }}>{checklist.title}</h2>
                  <p style={{ margin: 0, color: "var(--muted)" }}>
                    Status: {checklist.articleStatus} · /blog/{checklist.slug}
                  </p>
                </div>
                {checklist.nextAction ? (
                  <Link href={checklist.nextAction.href} style={buttonStyle}>
                    Next: {checklist.nextAction.label}
                  </Link>
                ) : (
                  <span style={{ color: "#15803d", fontWeight: 700 }}>
                    Checklist complete
                  </span>
                )}
              </div>

              <ol style={{ listStyle: "none", padding: 0, margin: "22px 0 0", display: "grid", gap: 12 }}>
                {checklist.steps.map((step, index) => (
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
                      <div style={{ color: "var(--muted)", lineHeight: 1.6, marginTop: 4 }}>
                        {step.detail}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          color: stateColor(step.state),
                          fontWeight: 700,
                          marginBottom: 8,
                        }}
                      >
                        {stateLabel(step.state)}
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
