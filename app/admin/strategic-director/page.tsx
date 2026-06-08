"use client"

import { useEffect, useState } from "react"
import {
  PageShell,
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  StatusBadge,
} from "@/components/executive-ui"

type StrategicPlan = {
  id: string
  title: string
  timeHorizon: string
  status: string
  strategicThesis: string | null
  priorities: any
  resourcePlan: any
  riskMap: any
  successMetrics: any
  createdAt: string
}

type Initiative = {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  ownerSystem: string | null
  targetOutcome: string | null
  riskLevel: string
  error: string | null
}

type Decision = {
  id: string
  title: string
  decision: string
  rationale: string | null
  impactArea: string | null
  status: string
  createdAt: string
}

export default function StrategicDirectorPage() {
  const [plans, setPlans] = useState<StrategicPlan[]>([])
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [timeHorizon, setTimeHorizon] = useState("90-days")
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/strategic-director")
    const result = await res.json()

    if (result.ok) {
      setPlans(result.plans)
      setInitiatives(result.initiatives)
      setDecisions(result.decisions)
    }
  }

  async function generatePlan() {
    setLoading(true)

    const res = await fetch("/api/strategic-director", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ timeHorizon }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Strategic plan generation failed")
      return
    }

    await loadData()
  }

  async function activateInitiative(initiativeId: string) {
    setLoading(true)

    const res = await fetch("/api/strategic-director/activate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ initiativeId }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Initiative activation failed")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const latestPlan = plans[0]
  const proposed = initiatives.filter((i) => i.status === "proposed").length
  const active = initiatives.filter((i) => i.status === "active").length
  const highPriority = initiatives.filter((i) => i.priority === "high").length

  return (
    <PageShell
      eyebrow="Strategic Consciousness"
      title="Autonomous Strategic Intelligence Director"
      description="Generate strategic direction, executive priorities, initiatives, resource allocation, risk maps and measurable plans from the whole AI operating organization."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Strategic Plans" value={plans.length} />
        <MetricCard label="Proposed Initiatives" value={proposed} />
        <MetricCard label="Active Initiatives" value={active} />
        <MetricCard label="High Priority" value={highPriority} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Strategic Planning Control" eyebrow="Executive direction">
          <select
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(e.target.value)}
            style={inputStyle}
          >
            <option value="30-days">30 days</option>
            <option value="90-days">90 days</option>
            <option value="6-months">6 months</option>
            <option value="12-months">12 months</option>
          </select>

          <button disabled={loading} onClick={generatePlan} style={buttonStyle}>
            {loading ? "Planning..." : "Generate Strategic Plan"}
          </button>

          {latestPlan ? (
            <div style={cardStyle}>
              <StatusBadge status={latestPlan.status} />
              <h3>{latestPlan.title}</h3>
              <p style={{ lineHeight: 1.7 }}>{latestPlan.strategicThesis}</p>
              <p style={{ color: "var(--muted)", fontSize: 12 }}>
                {latestPlan.timeHorizon} ·{" "}
                {new Date(latestPlan.createdAt).toLocaleString("en-AU")}
              </p>
            </div>
          ) : null}
        </ExecutiveCard>
      </div>

      {latestPlan ? (
        <div style={{ marginTop: 24 }}>
          <ExecutiveGrid min={320}>
            <ExecutiveCard title="Strategic Priorities" eyebrow="Direction">
              <ListCards items={latestPlan.priorities} />
            </ExecutiveCard>

            <ExecutiveCard title="Resource Plan" eyebrow="Allocation">
              <JsonSection data={latestPlan.resourcePlan} />
            </ExecutiveCard>

            <ExecutiveCard title="Risk Map" eyebrow="Strategic threats">
              <JsonSection data={latestPlan.riskMap} />
            </ExecutiveCard>

            <ExecutiveCard title="Success Metrics" eyebrow="Measurement">
              <List items={latestPlan.successMetrics} />
            </ExecutiveCard>
          </ExecutiveGrid>
        </div>
      ) : null}

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Strategic Initiatives" eyebrow="Execution options">
            <div style={{ display: "grid", gap: 12 }}>
              {initiatives.map((initiative) => (
                <div key={initiative.id} style={cardStyle}>
                  <StatusBadge status={initiative.status} />
                  <h3>{initiative.title}</h3>
                  <p>{initiative.description}</p>
                  <p>
                    <strong>Target:</strong> {initiative.targetOutcome || "Not set"}
                  </p>
                  <p style={{ color: "var(--muted)" }}>
                    {initiative.ownerSystem || "general"} · {initiative.priority} · Risk{" "}
                    {initiative.riskLevel}
                  </p>

                  {initiative.error ? (
                    <p style={{ color: "#b00020" }}>{initiative.error}</p>
                  ) : null}

                  {["proposed", "approved"].includes(initiative.status) ? (
                    <button
                      disabled={loading}
                      onClick={() => activateInitiative(initiative.id)}
                      style={buttonStyle}
                    >
                      Activate Initiative
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Executive Decision Log" eyebrow="Strategic memory">
            <div style={{ display: "grid", gap: 12 }}>
              {decisions.map((decision) => (
                <div key={decision.id} style={cardStyle}>
                  <StatusBadge status={decision.status} />
                  <h3>{decision.title}</h3>
                  <p>{decision.decision}</p>
                  {decision.rationale ? (
                    <p style={{ color: "var(--muted)" }}>{decision.rationale}</p>
                  ) : null}
                  <p style={{ color: "var(--muted)", fontSize: 12 }}>
                    {decision.impactArea || "general"} ·{" "}
                    {new Date(decision.createdAt).toLocaleString("en-AU")}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>
    </PageShell>
  )
}

function ListCards({ items }: { items: any }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p style={{ color: "var(--muted)" }}>No items yet.</p>
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((item, index) => (
        <div key={index} style={miniCardStyle}>
          <StatusBadge status={item.priority || "medium"} />
          <h3>{item.title}</h3>
          <p>{item.reason}</p>
          <p style={{ color: "var(--muted)" }}>{item.targetOutcome}</p>
        </div>
      ))}
    </div>
  )
}

function List({ items }: { items: any }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p style={{ color: "var(--muted)" }}>No items yet.</p>
  }

  return (
    <ul style={{ lineHeight: 1.9, paddingLeft: 20 }}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}

function JsonSection({ data }: { data: any }) {
  if (!data) return <p style={{ color: "var(--muted)" }}>No data yet.</p>

  return (
    <pre style={preStyle}>
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 260,
  borderRadius: 12,
  border: "1px solid var(--border)",
  padding: 12,
  marginRight: 12,
  marginBottom: 12,
  fontFamily: "inherit",
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 18,
  marginTop: 14,
  background: "var(--card-background)",
}

const miniCardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 14,
  background: "var(--card-background)",
}

const preStyle: React.CSSProperties = {
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  borderRadius: 14,
  padding: 14,
  overflowX: "auto",
  whiteSpace: "pre-wrap",
}