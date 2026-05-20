"use client"

import { useState } from "react"

type GrowthReport = {
  growthSummary?: string
  highestValueAudienceSegments?: string[]
  quickWins?: string[]
  thirtyDayGrowthPlan?: string[]
}

export default function GrowthIntelligencePage() {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<GrowthReport | null>(null)

  async function runGrowthIntelligence() {
    setLoading(true)
    setReport(null)

    const response = await fetch("/api/ai/growth-intelligence", {
      method: "POST",
    })

    const result = await response.json()

    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Growth intelligence failed")
      return
    }

    setReport(result.report)
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Revenue + Growth</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          AI Growth Intelligence
        </h1>

        <p style={{ color: "#ddd", maxWidth: 780, lineHeight: 1.7 }}>
          Analyze content, memory, jobs and activity to discover growth,
          monetization and audience opportunities.
        </p>

        <button
          disabled={loading}
          onClick={runGrowthIntelligence}
          style={buttonStyle}
        >
          {loading ? "Analyzing..." : "Run Growth Intelligence"}
        </button>
      </section>

      {report ? (
        <section style={{ marginTop: 30, display: "grid", gap: 22 }}>
          <Panel title="Growth Summary">
            <p style={paragraphStyle}>{report.growthSummary}</p>
          </Panel>

          <Grid>
            <ListPanel
              title="Highest Value Audience Segments"
              items={report.highestValueAudienceSegments}
            />

            <ListPanel
              title="Quick Wins"
              items={report.quickWins}
            />

            <ListPanel
              title="30-Day Growth Plan"
              items={report.thirtyDayGrowthPlan}
            />
          </Grid>
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
        <p style={{ color: "#666" }}>Nothing listed yet.</p>
      )}
    </Panel>
  )
}

const heroStyle: React.CSSProperties = {
  background: "#111",
  color: "#fff",
  borderRadius: 24,
  padding: 34,
}

const eyebrowStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "#aaa",
  margin: 0,
}

const buttonStyle: React.CSSProperties = {
  marginTop: 18,
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "#fff",
  color: "#111",
  cursor: "pointer",
  fontWeight: "bold",
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 20,
}

const panelStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const paragraphStyle: React.CSSProperties = {
  color: "#555",
  lineHeight: 1.7,
}