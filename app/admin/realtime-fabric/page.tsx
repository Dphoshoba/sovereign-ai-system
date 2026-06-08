"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

export default function RealtimeFabricPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [manualTitle, setManualTitle] = useState("Manual realtime event")

  async function loadData() {
    const res = await fetch("/api/realtime-fabric", {
      cache: "no-store",
    })
    const result = await res.json()

    if (result.ok) setData(result)
  }

  async function runFabric() {
    setLoading(true)

    const res = await fetch("/api/realtime-fabric", {
      method: "POST",
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Realtime fabric run failed")
      return
    }

    await loadData()
  }

  async function publishManualEvent() {
    setLoading(true)

    const res = await fetch("/api/realtime-fabric/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        streamName: "sovereign-runtime",
        eventType: "runtime-signal",
        source: "admin",
        title: manualTitle,
        message: "Manual event published from the realtime fabric console.",
        priority: "medium",
        payload: {
          manual: true,
        },
      }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Publish failed")
      return
    }

    await loadData()
  }

  async function runWorker(workerName?: string) {
    setLoading(true)

    const res = await fetch("/api/realtime-fabric/worker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ workerName }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Worker run failed")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()

    const interval = setInterval(() => {
      loadData()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const streams = data?.streams || []
  const messages = data?.messages || []
  const workers = data?.workers || []
  const jobs = data?.jobs || []
  const latest = data?.runs?.[0]

  const pendingMessages = messages.filter((m: any) => m.status === "pending").length
  const queuedJobs = jobs.filter((j: any) => j.status === "queued").length
  const runningJobs = jobs.filter((j: any) => j.status === "running").length
  const completedJobs = jobs.filter((j: any) => j.status === "completed").length

  return (
    <PageShell
      eyebrow="Live Nervous System"
      title="Sovereign Real-Time Event Fabric"
      description="Stream live events, route distributed execution jobs, coordinate workers and synchronize platform state across the sovereign runtime."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Event Health" value={latest?.eventHealth || 0} />
        <MetricCard label="Worker Health" value={latest?.workerHealth || 0} />
        <MetricCard label="Queue Pressure" value={latest?.queuePressure || 0} />
        <MetricCard label="Execution Health" value={latest?.executionHealth || 0} />
        <MetricCard label="Pending Events" value={pendingMessages} />
        <MetricCard label="Queued Jobs" value={queuedJobs} />
        <MetricCard label="Running Jobs" value={runningJobs} />
        <MetricCard label="Completed Jobs" value={completedJobs} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Realtime Fabric Control" eyebrow="Event orchestration">
            <button disabled={loading} onClick={runFabric} style={buttonStyle}>
              {loading ? "Running..." : "Run Realtime Fabric Cycle"}
            </button>

            {latest ? (
              <div style={cardStyle}>
                <StatusBadge status={latest.status} />
                <h3>{latest.title}</h3>
                <p>{latest.summary}</p>

                {latest.findings ? (
                  <pre style={preStyle}>{JSON.stringify(latest.findings, null, 2)}</pre>
                ) : null}
              </div>
            ) : null}
          </ExecutiveCard>

          <ExecutiveCard title="Publish Event" eyebrow="Manual signal">
            <input
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              style={inputStyle}
            />

            <button disabled={loading} onClick={publishManualEvent} style={buttonStyle}>
              Publish Event
            </button>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Streams" eyebrow="Live channels">
            <div style={{ display: "grid", gap: 12 }}>
              {streams.map((stream: any) => (
                <div key={stream.id} style={cardStyle}>
                  <StatusBadge status={stream.status} />
                  <h3>{stream.streamName}</h3>
                  <p>{stream.description}</p>
                  <p style={{ color: "var(--muted)" }}>{stream.streamType}</p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Workers" eyebrow="Distributed execution">
            <div style={{ display: "grid", gap: 12 }}>
              {workers.map((worker: any) => (
                <div key={worker.id} style={cardStyle}>
                  <StatusBadge status={worker.status} />
                  <h3>{worker.name}</h3>
                  <p style={{ color: "var(--muted)" }}>{worker.workerType}</p>

                  <button
                    disabled={loading}
                    onClick={() => runWorker(worker.name)}
                    style={buttonStyle}
                  >
                    Run Worker
                  </button>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Event Messages" eyebrow="Realtime stream">
            <div style={{ display: "grid", gap: 12 }}>
              {messages.map((message: any) => (
                <div key={message.id} style={cardStyle}>
                  <StatusBadge status={message.priority} />
                  <h3>{message.title}</h3>
                  <p>{message.message}</p>
                  <p style={{ color: "var(--muted)" }}>
                    {message.streamName} · {message.eventType} · {message.status}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Execution Jobs" eyebrow="Queue mesh">
            <div style={{ display: "grid", gap: 12 }}>
              {jobs.map((job: any) => (
                <div key={job.id} style={cardStyle}>
                  <StatusBadge status={job.status} />
                  <h3>{job.title}</h3>
                  <p style={{ color: "var(--muted)" }}>
                    {job.jobType} · {job.targetLayer} · {job.assignedWorker || "unassigned"}
                  </p>

                  {job.status === "queued" ? (
                    <button
                      disabled={loading}
                      onClick={() => runWorker(job.assignedWorker)}
                      style={buttonStyle}
                    >
                      Execute Job
                    </button>
                  ) : null}

                  {job.error ? (
                    <p style={{ color: "#b00020" }}>{job.error}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>
    </PageShell>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid var(--border)",
  padding: 12,
  marginBottom: 12,
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
  background: "var(--card-background)",
}

const preStyle: React.CSSProperties = {
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  padding: 14,
  borderRadius: 14,
  overflowX: "auto",
  whiteSpace: "pre-wrap",
}