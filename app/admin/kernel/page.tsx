"use client"

import { useState } from "react"

type KernelPlan = {
  missionSummary?: string
  detectedIntent?: string
  recommendedPath?: string
  systemsToUse?: string[]
  agentsToUse?: {
    agentId: string
    agentName: string
    reason: string
  }[]
  workflowSuggestions?: {
    workflowId: string
    workflowName: string
    reason: string
  }[]
  toolActions?: {
    action: string
    requiresApproval: boolean
    reason: string
    payload: Record<string, unknown>
  }[]
  governanceNotes?: string[]
  executionSteps?: string[]
  risks?: string[]
  nextBestAction?: string
}

export default function KernelPage() {
  const [mission, setMission] = useState("")
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<KernelPlan | null>(null)

  async function runKernel(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setPlan(null)

    const response = await fetch("/api/ai/kernel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mission }),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Kernel failed")
      return
    }

    setPlan(result.plan)
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>System Bus</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Unified AI Orchestration Kernel
        </h1>

        <p style={{ color: "#ddd", maxWidth: 880, lineHeight: 1.7 }}>
          Route any mission through agents, workflows, memory, governance,
          tools, CRM, revenue, publishing and strategic intelligence.
        </p>
      </section>

      <form onSubmit={runKernel} style={formStyle}>
        <label>
          Mission
          <textarea
            rows={7}
            required
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            placeholder="Example: Launch a 30-day AI automation campaign for churches, create content, identify leads, recommend offers and schedule follow-ups."
            style={inputStyle}
          />
        </label>

        <button disabled={loading} style={buttonStyle}>
          {loading ? "Routing Mission..." : "Run Kernel"}
        </button>
      </form>

      {plan ? (
        <section style={{ marginTop: 30, display: "grid", gap: 22 }}>
          <Panel title="Mission Summary">
            <p style={paragraphStyle}>{plan.missionSummary}</p>

            <div style={decisionBox}>
              <p style={metaStyle}>Detected Intent</p>
              <h2 style={{ margin: 0 }}>{plan.detectedIntent}</h2>
            </div>
          </Panel>

          <Panel title="Recommended Path">
            <p style={paragraphStyle}>{plan.recommendedPath}</p>
          </Panel>

          <Grid>
            <ListPanel title="Systems To Use" items={plan.systemsToUse} />
            <ListPanel title="Governance Notes" items={plan.governanceNotes} />
            <ListPanel title="Risks" items={plan.risks} />
            <ListPanel title="Execution Steps" items={plan.executionSteps} />
          </Grid>

          <Panel title="Recommended Agents">
            <div style={{ display: "grid", gap: 14 }}>
              {plan.agentsToUse?.map((agent, index) => (
                <div key={index} style={itemCard}>
                  <p style={metaStyle}>{agent.agentId}</p>
                  <h3>{agent.agentName}</h3>
                  <p style={paragraphStyle}>{agent.reason}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Workflow Suggestions">
            <div style={{ display: "grid", gap: 14 }}>
              {plan.workflowSuggestions?.map((workflow, index) => (
                <div key={index} style={itemCard}>
                  <p style={metaStyle}>{workflow.workflowId}</p>
                  <h3>{workflow.workflowName}</h3>
                  <p style={paragraphStyle}>{workflow.reason}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Tool Actions">
            <div style={{ display: "grid", gap: 14 }}>
              {plan.toolActions?.map((tool, index) => (
                <div key={index} style={itemCard}>
                  <p style={metaStyle}>
                    {tool.requiresApproval ? "Approval required" : "No approval required"}
                  </p>
                  <h3>{tool.action}</h3>
                  <p style={paragraphStyle}>{tool.reason}</p>
                  <pre style={preStyle}>
                    {JSON.stringify(tool.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Next Best Action">
            <p style={paragraphStyle}>{plan.nextBestAction}</p>
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
  maxWidth: 920,
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

const preStyle: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  background: "#111",
  color: "#fff",
  borderRadius: 12,
  padding: 16,
  overflowX: "auto",
}