"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type LiveData = {
  timestamp: string
  metrics: {
    activeAgents: number
    runningJobs: number
    queuedJobs: number
    failedJobs: number
    pendingApprovals: number
    activeWorkflows: number
    activeSchedules: number
  }
  jobs: any[]
  activity: any[]
  agents: any[]
  approvals: any[]
  scheduledOperations: any[]
  workflows: any[]
}

export default function LiveCommandCenterPage() {
  const [data, setData] = useState<LiveData | null>(null)
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  async function loadLiveData() {
    setLoading(true)

    const response = await fetch("/api/ai/live-command-center")
    const result = await response.json()

    setLoading(false)

    if (result.ok) {
      setData(result)
    }
  }

  async function runNextJob() {
    await fetch("/api/ai/jobs/run", {
      method: "POST",
    })

    loadLiveData()
  }

  async function runScheduler() {
    await fetch("/api/ai/scheduler/run", {
      method: "POST",
    })

    loadLiveData()
  }

  useEffect(() => {
    loadLiveData()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadLiveData()
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Live Operations</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Real-Time AI Command Center
        </h1>

        <p style={{ color: "#ddd", maxWidth: 860, lineHeight: 1.7 }}>
          Monitor agents, jobs, workflows, approvals, scheduled operations,
          activity events and system health in one live operational dashboard.
        </p>
      </section>

      <section style={toolbarStyle}>
        <button onClick={loadLiveData} disabled={loading} style={buttonStyle}>
          {loading ? "Refreshing..." : "Refresh Now"}
        </button>

        <button onClick={runNextJob} style={secondaryButton}>
          Run Next Job
        </button>

        <button onClick={runScheduler} style={secondaryButton}>
          Run Scheduler
        </button>

        <label style={checkboxStyle}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh every 5 seconds
        </label>

        {data ? (
          <span style={{ color: "#666" }}>
            Last update: {new Date(data.timestamp).toLocaleString("en-AU")}
          </span>
        ) : null}
      </section>

      {data ? (
        <>
          <section style={metricsGrid}>
            <Metric label="Active Agents" value={data.metrics.activeAgents} />
            <Metric label="Running Jobs" value={data.metrics.runningJobs} />
            <Metric label="Queued Jobs" value={data.metrics.queuedJobs} />
            <Metric label="Failed Jobs" value={data.metrics.failedJobs} />
            <Metric
              label="Pending Approvals"
              value={data.metrics.pendingApprovals}
            />
            <Metric label="Active Workflows" value={data.metrics.activeWorkflows} />
            <Metric label="Active Schedules" value={data.metrics.activeSchedules} />
          </section>

          <section style={gridTwo}>
            <Panel title="Running + Recent Jobs" href="/admin/jobs">
              {data.jobs.length === 0 ? (
                <Empty />
              ) : (
                data.jobs.slice(0, 8).map((job) => (
                  <Card key={job.id}>
                    <p style={metaStyle}>{job.status}</p>
                    <h3>{job.type}</h3>
                    <p>Attempts: {job.attempts}</p>
                    {job.error ? (
                      <p style={{ color: "#b00020" }}>{job.error}</p>
                    ) : null}
                  </Card>
                ))
              )}
            </Panel>

            <Panel title="Recent Activity" href="/admin/activity">
              {data.activity.length === 0 ? (
                <Empty />
              ) : (
                data.activity.slice(0, 8).map((event) => (
                  <Card key={event.id}>
                    <p style={metaStyle}>
                      {event.type} · {event.status}
                    </p>
                    <h3>{event.title}</h3>
                    {event.message ? (
                      <p style={{ color: "#555", lineHeight: 1.6 }}>
                        {event.message}
                      </p>
                    ) : null}
                  </Card>
                ))
              )}
            </Panel>
          </section>

          <section style={gridTwo}>
            <Panel title="Active Agents" href="/admin/agents">
              {data.agents.length === 0 ? (
                <Empty />
              ) : (
                data.agents.slice(0, 8).map((agent) => (
                  <Card key={agent.id}>
                    <p style={metaStyle}>
                      {agent.department?.name || "General"}
                    </p>
                    <h3>{agent.name}</h3>
                    <p style={{ color: "#555" }}>{agent.role}</p>
                  </Card>
                ))
              )}
            </Panel>

            <Panel title="Pending Approvals" href="/admin/governance">
              {data.approvals.filter((a) => a.status === "pending").length ===
              0 ? (
                <Empty />
              ) : (
                data.approvals
                  .filter((a) => a.status === "pending")
                  .slice(0, 8)
                  .map((approval) => (
                    <Card key={approval.id}>
                      <p style={metaStyle}>{approval.status}</p>
                      <h3>{approval.action}</h3>
                      {approval.reason ? <p>{approval.reason}</p> : null}
                    </Card>
                  ))
              )}
            </Panel>
          </section>

          <section style={gridTwo}>
            <Panel title="Scheduled Operations" href="/admin/scheduler">
              {data.scheduledOperations.length === 0 ? (
                <Empty />
              ) : (
                data.scheduledOperations.slice(0, 8).map((operation) => (
                  <Card key={operation.id}>
                    <p style={metaStyle}>
                      {operation.status} · {operation.frequency}
                    </p>
                    <h3>{operation.name}</h3>
                    <p>
                      Next:{" "}
                      {new Date(operation.nextRunAt).toLocaleString("en-AU")}
                    </p>
                  </Card>
                ))
              )}
            </Panel>

            <Panel title="Active Workflows" href="/admin/workflows">
              {data.workflows.length === 0 ? (
                <Empty />
              ) : (
                data.workflows.slice(0, 8).map((workflow) => (
                  <Card key={workflow.id}>
                    <p style={metaStyle}>{workflow.status}</p>
                    <h3>{workflow.name}</h3>
                    <p style={{ color: "#555" }}>
                      {workflow.trigger} → {workflow.action}
                    </p>
                  </Card>
                ))
              )}
            </Panel>
          </section>
        </>
      ) : null}
    </main>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={metricCard}>
      <p style={metaStyle}>{label}</p>
      <h2>{value}</h2>
    </div>
  )
}

function Panel({
  title,
  href,
  children,
}: {
  title: string
  href: string
  children: React.ReactNode
}) {
  return (
    <section style={panelStyle}>
      <div style={panelHeader}>
        <h2 style={{ margin: 0 }}>{title}</h2>

        <Link href={href} style={plainLink}>
          Open →
        </Link>
      </div>

      <div style={{ display: "grid", gap: 14 }}>{children}</div>
    </section>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={cardStyle}>{children}</div>
}

function Empty() {
  return <p style={{ color: "#666" }}>Nothing to show.</p>
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

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 24,
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

const secondaryButton: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "#fff",
  color: "#111",
  cursor: "pointer",
  fontWeight: "bold",
}

const checkboxStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  fontWeight: "bold",
}

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 16,
  marginTop: 28,
}

const metricCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 22,
}

const gridTwo: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
  gap: 22,
  marginTop: 28,
}

const panelStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 20,
  padding: 24,
}

const panelHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 16,
}

const cardStyle: React.CSSProperties = {
  background: "#f7f7f7",
  border: "1px solid #eee",
  borderRadius: 14,
  padding: 18,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#777",
  fontSize: 13,
  margin: 0,
}

const plainLink: React.CSSProperties = {
  color: "#111",
  fontWeight: "bold",
  textDecoration: "none",
}