"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

export default function ActionEnginePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/action-engine")
    const result = await res.json()

    if (result.ok) setData(result)
  }

  async function runActionEngine() {
    setLoading(true)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 120000)

      const res = await fetch("/api/action-engine", {
        method: "POST",
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const result = await res.json()

      if (!result.ok) {
        alert(result.error || "Action coordination failed")
        return
      }

      await loadData()
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Action coordination stopped unexpectedly"
      )
    } finally {
      setLoading(false)
    }
  }

  async function executeStep(stepId: string) {
    setLoading(true)

    try {
      const res = await fetch("/api/action-engine/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stepId }),
      })

      const result = await res.json()

      if (!result.ok) {
        alert(result.error || "Step execution failed")
        return
      }

      await loadData()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Step execution failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const missions = data?.missions || []
  const steps = data?.steps || []
  const assignments = data?.assignments || []
  const outcomes = data?.outcomes || []
  const latest = data?.runs?.[0]

  const queuedSteps = steps.filter((s: any) => s.status === "queued").length
  const approvalSteps = steps.filter((s: any) =>
    ["approval-required", "approval-requested"].includes(s.status)
  ).length
  const completedSteps = steps.filter((s: any) => s.status === "completed").length

  return (
    <PageShell
      eyebrow="Multi-Agent Execution Coordination"
      title="Autonomous Action Engine"
      description="Turn governed reasoning recommendations into missions, execution steps, agent assignments and closed-loop operational outcomes."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Missions" value={missions.length} />
        <MetricCard label="Steps" value={steps.length} />
        <MetricCard label="Assignments" value={assignments.length} />
        <MetricCard label="Queued Steps" value={queuedSteps} />
        <MetricCard label="Approval Steps" value={approvalSteps} />
        <MetricCard label="Completed Steps" value={completedSteps} />
        <MetricCard label="Outcomes" value={outcomes.length} />
        <MetricCard label="Execution Health" value={latest?.executionHealth || 0} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Action Coordination Runtime" eyebrow="Mission generation">
          <button disabled={loading} onClick={runActionEngine} style={buttonStyle}>
            {loading ? "Coordinating..." : "Run Action Engine"}
          </button>

          {latest ? (
            <div style={cardStyle}>
              <StatusBadge status={latest.status} />
              <h3>{latest.title}</h3>
              <p>{latest.summary}</p>
              <p style={{ color: "#666" }}>
                Execution {latest.executionHealth}/100 · Agent{" "}
                {latest.agentHealth}/100 · Mission pressure{" "}
                {latest.missionPressure}/100
              </p>
              <pre style={preStyle}>{JSON.stringify(latest.findings, null, 2)}</pre>
            </div>
          ) : null}
        </ExecutiveCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Missions" eyebrow="Coordinated objectives">
            <div style={{ display: "grid", gap: 12 }}>
              {missions.map((mission: any) => (
                <div key={mission.id} style={cardStyle}>
                  <StatusBadge status={mission.status} />
                  <h3>{mission.title}</h3>
                  <p>{mission.objective}</p>
                  <p style={{ color: "#666" }}>
                    {mission.missionType} · {mission.priority} · Progress{" "}
                    {mission.progressScore}/100
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Execution Steps" eyebrow="Action queue">
            <div style={{ display: "grid", gap: 12 }}>
              {steps.map((step: any) => (
                <div key={step.id} style={cardStyle}>
                  <StatusBadge status={step.status} />
                  <h3>{step.title}</h3>
                  <p>{step.instruction}</p>
                  <p style={{ color: "#666" }}>
                    {step.stepType} · {step.targetLayer} · Agent{" "}
                    {step.assignedAgent || "unassigned"}
                  </p>

                  {["queued", "approval-required"].includes(step.status) ? (
                    <button
                      disabled={loading}
                      onClick={() => executeStep(step.id)}
                      style={buttonStyle}
                    >
                      Execute Step
                    </button>
                  ) : null}

                  {step.error ? (
                    <p style={{ color: "#b00020" }}>{step.error}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Agent Assignments" eyebrow="Delegation map">
            <div style={{ display: "grid", gap: 12 }}>
              {assignments.map((assignment: any) => (
                <div key={assignment.id} style={cardStyle}>
                  <StatusBadge status={assignment.status} />
                  <h3>{assignment.agentName}</h3>
                  <p>{assignment.instruction}</p>
                  <p style={{ color: "#666" }}>
                    {assignment.agentRole} · Confidence{" "}
                    {Math.round((assignment.confidence || 0) * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Action Outcomes" eyebrow="Execution memory">
            <div style={{ display: "grid", gap: 12 }}>
              {outcomes.map((outcome: any) => (
                <div key={outcome.id} style={cardStyle}>
                  <StatusBadge status={outcome.impactLevel} />
                  <h3>{outcome.title}</h3>
                  <p>{outcome.summary}</p>
                  <p style={{ color: "#666" }}>{outcome.outcomeType}</p>
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

const preStyle: React.CSSProperties = {
  background: "#111",
  color: "#fff",
  padding: 14,
  borderRadius: 14,
  overflowX: "auto",
  whiteSpace: "pre-wrap",
}