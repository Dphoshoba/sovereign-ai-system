"use client"

import { useEffect, useState } from "react"
import {
  PageShell,
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  StatusBadge,
} from "@/components/executive-ui"

export default function ExecutiveOperationsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/executive-operations")
    const result = await res.json()

    if (result.ok) {
      setData(result)
    }
  }

  async function runOperationsCycle() {
    setLoading(true)

    const res = await fetch("/api/executive-operations", {
      method: "POST",
    })

    const result = await res.json()

    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Executive operations cycle failed")
      return
    }

    await loadData()
  }

  async function executeTask(taskId: string) {
    setLoading(true)

    const res = await fetch("/api/executive-operations/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ taskId }),
    })

    const result = await res.json()

    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Task execution failed")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const pulse = data?.pulses?.[0]

  return (
    <PageShell
      eyebrow="Autonomous Executive Runtime"
      title="Executive Operations Grid"
      description="Coordinate enterprise execution, operational tempo, strategic synchronization and autonomous command operations."
    >
      <ExecutiveGrid min={220}>
        <MetricCard
          label="Operational Health"
          value={pulse?.operationalHealth || 0}
        />
        <MetricCard
          label="Execution Velocity"
          value={pulse?.executionVelocity || 0}
        />
        <MetricCard
          label="Coordination Score"
          value={pulse?.coordinationScore || 0}
        />
        <MetricCard
          label="Strategic Alignment"
          value={pulse?.strategicAlignment || 0}
        />
        <MetricCard
          label="Risk Pressure"
          value={pulse?.riskPressure || 0}
        />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard
          title="Executive Operations Runtime"
          eyebrow="Organizational command"
        >
          <button
            disabled={loading}
            onClick={runOperationsCycle}
            style={buttonStyle}
          >
            {loading ? "Coordinating..." : "Run Executive Operations Cycle"}
          </button>

          {pulse ? (
            <div style={cardStyle}>
              <h3>{pulse.title}</h3>
              <p>{pulse.summary}</p>
            </div>
          ) : null}
        </ExecutiveCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Campaigns" eyebrow="Operational initiatives">
            <div style={{ display: "grid", gap: 12 }}>
              {data?.campaigns?.map((campaign: any) => (
                <div key={campaign.id} style={cardStyle}>
                  <StatusBadge status={campaign.status} />
                  <h3>{campaign.title}</h3>
                  <p>{campaign.description}</p>
                  <p style={{ color: "#666" }}>
                    {campaign.campaignType} · Tempo{" "}
                    {campaign.executionTempo}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Executive Tasks" eyebrow="Command execution">
            <div style={{ display: "grid", gap: 12 }}>
              {data?.tasks?.map((task: any) => (
                <div key={task.id} style={cardStyle}>
                  <StatusBadge status={task.status} />
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>

                  <p style={{ color: "#666" }}>
                    {task.ownerSystem} · {task.executionMode}
                  </p>

                  {task.status === "queued" ? (
                    <button
                      disabled={loading}
                      onClick={() => executeTask(task.id)}
                      style={buttonStyle}
                    >
                      Execute Task
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Command Decisions" eyebrow="Executive direction">
            <div style={{ display: "grid", gap: 12 }}>
              {data?.decisions?.map((decision: any) => (
                <div key={decision.id} style={cardStyle}>
                  <StatusBadge status={decision.impactLevel} />
                  <h3>{decision.title}</h3>
                  <p>{decision.rationale}</p>
                  <p style={{ color: "#666" }}>
                    {decision.decisionType}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Pulse Recommendations" eyebrow="Operational guidance">
            <ul style={{ lineHeight: 1.9 }}>
              {pulse?.recommendations?.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
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