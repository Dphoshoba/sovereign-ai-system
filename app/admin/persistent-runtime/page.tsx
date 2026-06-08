"use client"

import { useEffect, useState } from "react"
import {
  PageShell,
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  StatusBadge,
} from "@/components/executive-ui"

type Objective = {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  cadence: string
}

type Heartbeat = {
  id: string
  status: string
  summary: string | null
  healthScore: number
  metrics: any
  createdAt: string
}

type Snapshot = {
  id: string
  title: string
  summary: string | null
  snapshot: any
  createdAt: string
}

type Retry = {
  id: string
  source: string
  title: string
  status: string
  attempts: number
  maxAttempts: number
  error: string | null
}

export default function PersistentRuntimePage() {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [heartbeats, setHeartbeats] = useState<Heartbeat[]>([])
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [retries, setRetries] = useState<Retry[]>([])
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/persistent-runtime")
    const result = await res.json()

    if (result.ok) {
      setObjectives(result.objectives)
      setHeartbeats(result.heartbeats)
      setSnapshots(result.snapshots)
      setRetries(result.retries)
    }
  }

  async function runHeartbeat() {
    setLoading(true)

    const res = await fetch("/api/persistent-runtime", {
      method: "POST",
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Runtime heartbeat failed")
      return
    }

    await loadData()
  }

  async function retryItem(retryId: string) {
    setLoading(true)

    const res = await fetch("/api/persistent-runtime/retry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ retryId }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Retry failed")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const latest = heartbeats[0]
  const activeObjectives = objectives.filter((item) => item.status === "active").length
  const queuedRetries = retries.filter((item) => item.status === "queued").length

  return (
    <PageShell
      eyebrow="Continuous Operations"
      title="Persistent Autonomous Runtime"
      description="Maintain organizational continuity through runtime heartbeats, memory snapshots, persistent objectives and retry-aware recovery."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Runtime Health" value={latest ? `${latest.healthScore}/100` : "N/A"} />
        <MetricCard label="Runtime Status" value={latest?.status || "No heartbeat"} />
        <MetricCard label="Active Objectives" value={activeObjectives} />
        <MetricCard label="Queued Retries" value={queuedRetries} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Runtime Control" eyebrow="Heartbeat">
          <button disabled={loading} onClick={runHeartbeat} style={buttonStyle}>
            {loading ? "Generating..." : "Generate Runtime Heartbeat"}
          </button>

          {latest ? (
            <div style={cardStyle}>
              <StatusBadge status={latest.status} />
              <h3>Latest Heartbeat</h3>
              <p>{latest.summary}</p>
              <p style={{ color: "var(--muted)", fontSize: 12 }}>
                {new Date(latest.createdAt).toLocaleString("en-AU")}
              </p>
            </div>
          ) : null}
        </ExecutiveCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Persistent Objectives" eyebrow="Continuity goals">
            <div style={{ display: "grid", gap: 12 }}>
              {objectives.map((objective) => (
                <div key={objective.id} style={cardStyle}>
                  <StatusBadge status={objective.priority} />
                  <h3>{objective.title}</h3>
                  <p>{objective.description}</p>
                  <p style={{ color: "var(--muted)" }}>
                    {objective.status} · {objective.cadence}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Runtime Memory Snapshots" eyebrow="Continuity memory">
            <div style={{ display: "grid", gap: 12 }}>
              {snapshots.map((snapshot) => (
                <div key={snapshot.id} style={cardStyle}>
                  <h3>{snapshot.title}</h3>
                  <p>{snapshot.summary}</p>

                  {snapshot.snapshot?.whatNeedsAttention?.length ? (
                    <ul style={{ lineHeight: 1.8 }}>
                      {snapshot.snapshot.whatNeedsAttention.map(
                        (item: string, index: number) => (
                          <li key={index}>{item}</li>
                        )
                      )}
                    </ul>
                  ) : null}

                  <p style={{ color: "var(--muted)", fontSize: 12 }}>
                    {new Date(snapshot.createdAt).toLocaleString("en-AU")}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Retry Queue" eyebrow="Recovery continuity">
          <div style={{ display: "grid", gap: 12 }}>
            {retries.map((retry) => (
              <div key={retry.id} style={cardStyle}>
                <StatusBadge status={retry.status} />
                <h3>{retry.title}</h3>
                <p>{retry.error}</p>
                <p style={{ color: "var(--muted)" }}>
                  {retry.source} · Attempts {retry.attempts}/{retry.maxAttempts}
                </p>

                {retry.status === "queued" ? (
                  <button
                    disabled={loading}
                    onClick={() => retryItem(retry.id)}
                    style={buttonStyle}
                  >
                    Retry Item
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </ExecutiveCard>
      </div>
    </PageShell>
  )
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