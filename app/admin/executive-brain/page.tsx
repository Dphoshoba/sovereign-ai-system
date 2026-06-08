"use client"

import { useState } from "react"

type ExecutiveReport = {
  executiveSummary?: string
  currentStrengths?: string[]
  risks?: string[]
  contentGaps?: string[]
  nextBestActions?: {
    priority: string
    action: string
    reason: string
  }[]
  recommendedArticles?: {
    title: string
    category: string
    reason: string
    keywords: string[]
  }[]
  systemImprovements?: string[]
  ministryAndBusinessInsight?: string
  thirtyDayPlan?: string[]
}

export default function ExecutiveBrainPage() {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<ExecutiveReport | null>(null)

  async function runExecutiveBrain() {
    setLoading(true)
    setReport(null)

    const response = await fetch("/api/ai/executive-brain", {
      method: "POST",
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Executive Brain failed")
      return
    }

    setReport(result.report)
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Strategic Intelligence</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>AI Executive Brain</h1>
        <p style={{ color: "var(--hero-muted)", maxWidth: 780, lineHeight: 1.7 }}>
          Analyze the whole Echoes & Visions publishing system: articles,
          memory, jobs, activity, content gaps, risks, and next best moves.
        </p>

        <button disabled={loading} onClick={runExecutiveBrain} style={buttonStyle}>
          {loading ? "Thinking strategically..." : "Run Executive Brain"}
        </button>
      </section>

      {report ? (
        <section style={{ marginTop: 30, display: "grid", gap: 22 }}>
          <Panel title="Executive Summary">
            <p style={paragraphStyle}>{report.executiveSummary}</p>
          </Panel>

          <Grid>
            <ListPanel title="Current Strengths" items={report.currentStrengths} />
            <ListPanel title="Risks" items={report.risks} />
            <ListPanel title="Content Gaps" items={report.contentGaps} />
            <ListPanel title="System Improvements" items={report.systemImprovements} />
          </Grid>

          <Panel title="Next Best Actions">
            <div style={{ display: "grid", gap: 14 }}>
              {report.nextBestActions?.map((item, index) => (
                <div key={index} style={itemCard}>
                  <p style={metaStyle}>{item.priority}</p>
                  <h3>{item.action}</h3>
                  <p style={paragraphStyle}>{item.reason}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recommended Articles">
            <div style={{ display: "grid", gap: 14 }}>
              {report.recommendedArticles?.map((article, index) => (
                <div key={index} style={itemCard}>
                  <p style={metaStyle}>{article.category}</p>
                  <h3>{article.title}</h3>
                  <p style={paragraphStyle}>{article.reason}</p>
                  <p>
                    <strong>Keywords:</strong> {article.keywords?.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Ministry + Business Insight">
            <p style={paragraphStyle}>{report.ministryAndBusinessInsight}</p>
          </Panel>

          <ListPanel title="30-Day Strategic Plan" items={report.thirtyDayPlan} />
        </section>
      ) : null}
    </main>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={gridStyle}>{children}</div>
}

function Panel({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section style={panelStyle}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {children}
    </section>
  )
}

function ListPanel({
  title,
  items,
}: {
  title: string
  items?: string[]
}) {
  return (
    <Panel title={title}>
      {items && items.length > 0 ? (
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "var(--muted)" }}>Nothing listed yet.</p>
      )}
    </Panel>
  )
}

const heroStyle: React.CSSProperties = {
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  borderRadius: 24,
  padding: 34,
}

const eyebrowStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--muted)",
  margin: 0,
}

const buttonStyle: React.CSSProperties = {
  marginTop: 18,
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "var(--card-background)",
  color: "var(--foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 20,
}

const panelStyle: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const itemCard: React.CSSProperties = {
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 18,
}

const paragraphStyle: React.CSSProperties = {
  color: "var(--muted)",
  lineHeight: 1.7,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--muted)",
  fontSize: 13,
  margin: 0,
}