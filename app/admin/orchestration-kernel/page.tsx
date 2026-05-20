"use client"

import { useEffect, useState } from "react"
import {
  PageShell,
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  StatusBadge,
} from "@/components/executive-ui"

type KernelRun = {
  id: string
  title: string
  status: string
  mode: string
  priority: string
  summary: string | null
  healthScore: number
  createdAt: string
}

type Decision = {
  id: string
  title: string
  decisionType: string
  targetSystem: string
  priority: string
  status: string
  reason: string | null
  result: any
  error: string | null
  createdAt: string
}

export default function OrchestrationKernelPage() {
  const [runs, setRuns] = useState<KernelRun[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/orchestration-kernel")
    const result = await res.json()

    if (result.ok) {
      setRuns(result.runs)
      setDecisions(result.decisions)
    }
  }

  async function runKernel() {
    setLoading(true)

    const res = await fetch("/api/orchestration-kernel", {
      method: "POST",
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Kernel run failed")
      return
    }

    await loadData()
  }

  async function executeDecision(decisionId: string) {
    setLoading(true)

    const res = await fetch("/api/orchestration-kernel/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ decisionId }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Decision execution failed")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const latestRun = runs[0]
  const proposed = decisions.filter((d) => d.status === "proposed").length
  const completed = decisions.filter((d) => d.status === "completed").length
  const failed = decisions.filter((d) => d.status === "failed").length

  return (
    <PageShell
      eyebrow="Coordination Runtime"
      title="Autonomous Orchestration Kernel"
      description="Coordinate events, workflows, agents, missions, tools, email, optimization and forecasting into one governed autonomous runtime."
    >
      <ExecutiveGrid min={220}>
        <MetricCard
          label="Kernel Health"
          value={latestRun ? `${latestRun.healthScore}/100` : "N/A"}
        />
        <MetricCard label="Kernel Runs" value={runs.length} />
        <MetricCard label="Proposed Decisions" value={proposed} />
        <MetricCard label="Completed Decisions" value={completed} />
        <MetricCard label="Failed Decisions" value={failed} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Kernel Control" eyebrow="Autonomous coordination">
          <button disabled={loading} onClick={runKernel} style={buttonStyle}>
            {loading ? "Coordinating..." : "Run Orchestration Kernel"}
          </button>

          {latestRun ? (
            <div style={summaryStyle}>
              <StatusBadge status={latestRun.priority} />
              <h3>{latestRun.title}</h3>
              <p>{latestRun.summary}</p>
            </div>
          ) : null}
        </ExecutiveCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Coordination Decisions" eyebrow="Execution queue">
            <div style={{ display: "grid", gap: 14 }}>
              {decisions.map((decision) => (
                <div key={decision.id} style={cardStyle}>
                  <StatusBadge status={decision.status} />

                  <h3>{decision.title}</h3>

                  <p>
                    <strong>Type:</strong> {decision.decisionType}
                  </p>

                  <p>
                    <strong>Target:</strong> {decision.targetSystem}
                  </p>

                  {decision.reason ? (
                    <p style={{ lineHeight: 1.7 }}>{decision.reason}</p>
                  ) : null}

                  {decision.error ? (
                    <p style={{ color: "#b00020" }}>{decision.error}</p>
                  ) : null}

                  {["proposed", "approved"].includes(decision.status) ? (
                    <button
                      disabled={loading}
                      onClick={() => executeDecision(decision.id)}
                      style={buttonStyle}
                    >
                      Execute Decision
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Kernel Run History" eyebrow="Runtime memory">
            <div style={{ display: "grid", gap: 14 }}>
              {runs.map((run) => (
                <div key={run.id} style={cardStyle}>
                  <StatusBadge status={run.status} />
                  <h3>{run.title}</h3>
                  <p>{run.summary}</p>
                  <p style={{ color: "#777", fontSize: 12 }}>
                    Health {run.healthScore}/100 ·{" "}
                    {new Date(run.createdAt).toLocaleString("en-AU")}
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

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 16,
  padding: 18,
  background: "#fafafa",
}

const summaryStyle: React.CSSProperties = {
  marginTop: 18,
  border: "1px solid #ddd",
  borderRadius: 16,
  padding: 18,
  background: "#fafafa",
}