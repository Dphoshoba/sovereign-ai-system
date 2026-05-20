"use client"

import { useState } from "react"

type Report = {
  summary?: string
  detectedWeaknesses?: string[]
  promptImprovements?: {
    area: string
    recommendation: string
    examplePromptAddition: string
  }[]
  workflowImprovements?: {
    workflow: string
    issue: string
    fix: string
  }[]
  contentQualityImprovements?: string[]
  seoImprovements?: string[]
  automationRisks?: string[]
  nextBestSystemUpgrades?: string[]
  recommendedMemoryUpdates?: {
    type: string
    title: string
    content: string
    tags: string
  }[]
}

export default function SelfImprovementPage() {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<Report | null>(null)

  async function runSelfImprovement() {
    setLoading(true)
    setReport(null)

    const response = await fetch("/api/ai/self-improvement", {
      method: "POST",
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Self-improvement failed")
      return
    }

    setReport(result.report)
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Optimization Layer</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          AI Self-Improvement System
        </h1>
        <p style={{ color: "#ddd", maxWidth: 780, lineHeight: 1.7 }}>
          Analyze articles, jobs, activity, memories and prompt behavior to
          identify improvements before they become problems.
        </p>

        <button
          disabled={loading}
          onClick={runSelfImprovement}
          style={buttonStyle}
        >
          {loading ? "Analyzing..." : "Run Self-Improvement Review"}
        </button>
      </section>

      {report ? (
        <section style={{ marginTop: 30, display: "grid", gap: 22 }}>
          <Panel title="Summary">
            <p style={paragraphStyle}>{report.summary}</p>
          </Panel>

          <Grid>
            <ListPanel title="Detected Weaknesses" items={report.detectedWeaknesses} />
            <ListPanel title="Content Quality Improvements" items={report.contentQualityImprovements} />
            <ListPanel title="SEO Improvements" items={report.seoImprovements} />
            <ListPanel title="Automation Risks" items={report.automationRisks} />
          </Grid>

          <Panel title="Prompt Improvements">
            <div style={{ display: "grid", gap: 14 }}>
              {report.promptImprovements?.map((item, index) => (
                <div key={index} style={itemCard}>
                  <p style={metaStyle}>{item.area}</p>
                  <h3>{item.recommendation}</h3>
                  <pre style={preStyle}>{item.examplePromptAddition}</pre>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Workflow Improvements">
            <div style={{ display: "grid", gap: 14 }}>
              {report.workflowImprovements?.map((item, index) => (
                <div key={index} style={itemCard}>
                  <p style={metaStyle}>{item.workflow}</p>
                  <h3>{item.issue}</h3>
                  <p style={paragraphStyle}>{item.fix}</p>
                </div>
              ))}
            </div>
          </Panel>

          <ListPanel
            title="Next Best System Upgrades"
            items={report.nextBestSystemUpgrades}
          />

          <Panel title="Recommended Memory Updates">
            <div style={{ display: "grid", gap: 14 }}>
              {report.recommendedMemoryUpdates?.map((memory, index) => (
                <div key={index} style={itemCard}>
                  <p style={metaStyle}>{memory.type}</p>
                  <h3>{memory.title}</h3>
                  <p style={paragraphStyle}>{memory.content}</p>
                  <p>
                    <strong>Tags:</strong> {memory.tags}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
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

function ListPanel({ title, items }: { title: string; items?: string[] }) {
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

const itemCard: React.CSSProperties = {
  background: "#f7f7f7",
  border: "1px solid #eee",
  borderRadius: 14,
  padding: 18,
}

const paragraphStyle: React.CSSProperties = {
  color: "#555",
  lineHeight: 1.7,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#777",
  fontSize: 13,
  margin: 0,
}

const preStyle: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  background: "#111",
  color: "#fff",
  borderRadius: 12,
  padding: 16,
  lineHeight: 1.6,
}