"use client"

import { useState } from "react"

type Simulation = {
  scenarioSummary?: string
  baseAssumptions?: string[]
  upsideOpportunities?: string[]
  majorRisks?: string[]
  likelyOutcomes?: {
    timeframe: string
    outcome: string
    confidence: string
  }[]
  revenueImplications?: string[]
  contentImplications?: string[]
  crmImplications?: string[]
  agentAndWorkflowRecommendations?: string[]
  recommendedActions?: {
    priority: string
    action: string
    reason: string
  }[]
  decision?: string
  executiveRecommendation?: string
}

export default function SimulationPage() {
  const [scenario, setScenario] = useState("")
  const [loading, setLoading] = useState(false)
  const [simulation, setSimulation] = useState<Simulation | null>(null)

  async function runSimulation(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setSimulation(null)

    const response = await fetch("/api/ai/simulation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scenario }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Simulation failed")
      return
    }

    setSimulation(result.simulation)
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Strategic War Room</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          AI Simulation + Scenario Planning
        </h1>

        <p style={{ color: "#ddd", maxWidth: 850, lineHeight: 1.7 }}>
          Simulate growth paths, revenue strategies, content moves, ministry
          expansion, product direction and operational risks before you commit.
        </p>
      </section>

      <form onSubmit={runSimulation} style={formStyle}>
        <label>
          Scenario to Simulate
          <textarea
            rows={7}
            required
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="Example: What happens if Echoes & Visions focuses on AI automation packages for churches and small businesses over the next 90 days?"
            style={inputStyle}
          />
        </label>

        <button disabled={loading} style={buttonStyle}>
          {loading ? "Simulating..." : "Run Simulation"}
        </button>
      </form>

      {simulation ? (
        <section style={{ marginTop: 30, display: "grid", gap: 22 }}>
          <Panel title="Scenario Summary">
            <p style={paragraphStyle}>{simulation.scenarioSummary}</p>

            {simulation.decision ? (
              <div style={decisionBox}>
                <p style={metaStyle}>Decision</p>
                <h2 style={{ margin: 0 }}>{simulation.decision}</h2>
              </div>
            ) : null}
          </Panel>

          <Panel title="Executive Recommendation">
            <p style={paragraphStyle}>{simulation.executiveRecommendation}</p>
          </Panel>

          <Grid>
            <ListPanel title="Base Assumptions" items={simulation.baseAssumptions} />
            <ListPanel title="Upside Opportunities" items={simulation.upsideOpportunities} />
            <ListPanel title="Major Risks" items={simulation.majorRisks} />
          </Grid>

          <Panel title="Likely Outcomes">
            <div style={{ display: "grid", gap: 14 }}>
              {simulation.likelyOutcomes?.map((item, index) => (
                <div key={index} style={itemCard}>
                  <p style={metaStyle}>
                    {item.timeframe} · {item.confidence} confidence
                  </p>
                  <p style={paragraphStyle}>{item.outcome}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Grid>
            <ListPanel
              title="Revenue Implications"
              items={simulation.revenueImplications}
            />

            <ListPanel
              title="Content Implications"
              items={simulation.contentImplications}
            />

            <ListPanel
              title="CRM Implications"
              items={simulation.crmImplications}
            />

            <ListPanel
              title="Agent + Workflow Recommendations"
              items={simulation.agentAndWorkflowRecommendations}
            />
          </Grid>

          <Panel title="Recommended Actions">
            <div style={{ display: "grid", gap: 14 }}>
              {simulation.recommendedActions?.map((item, index) => (
                <div key={index} style={itemCard}>
                  <p style={metaStyle}>{item.priority}</p>
                  <h3>{item.action}</h3>
                  <p style={paragraphStyle}>{item.reason}</p>
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

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
  maxWidth: 900,
  marginTop: 24,
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #ccc",
  fontSize: 16,
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "#111",
  color: "#fff",
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

const decisionBox: React.CSSProperties = {
  marginTop: 18,
  background: "#111",
  color: "#fff",
  borderRadius: 16,
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