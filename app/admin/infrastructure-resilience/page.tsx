"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

export default function InfrastructureResiliencePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/infrastructure-resilience")
    const result = await res.json()

    if (result.ok) {
      setData(result)
    }
  }

  async function runResilience() {
    setLoading(true)

    const res = await fetch("/api/infrastructure-resilience", {
      method: "POST",
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Infrastructure resilience run failed")
      return
    }

    await loadData()
  }

  async function retryJob(retryJobId: string) {
    setLoading(true)

    const res = await fetch("/api/infrastructure-resilience/retry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ retryJobId }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Retry failed")
      return
    }

    await loadData()
  }

  async function incidentAction(incidentId: string, action: string) {
    setLoading(true)

    const res = await fetch("/api/infrastructure-resilience/incident", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        incidentId,
        action,
        notes: `Incident ${action}`,
      }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Incident action failed")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const checks = data?.checks || []
  const incidents = data?.incidents || []
  const policies = data?.policies || []
  const retryJobs = data?.retryJobs || []
  const latest = data?.runs?.[0]

  const failedChecks = checks.filter((c: any) => c.status === "failed").length
  const openIncidents = incidents.filter((i: any) => i.status === "open").length
  const queuedRetries = retryJobs.filter((j: any) => j.status === "queued").length

  return (
    <PageShell
      eyebrow="Operational Resilience Mesh"
      title="Sovereign Infrastructure Hardening"
      description="Monitor system health, detect incidents, queue retries, enforce resilience policies and protect the runtime from operational failure."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Health Score" value={latest?.healthScore || 0} />
        <MetricCard label="Resilience Score" value={latest?.resilienceScore || 0} />
        <MetricCard label="Risk Score" value={latest?.riskScore || 0} />
        <MetricCard label="Failed Checks" value={failedChecks} />
        <MetricCard label="Open Incidents" value={openIncidents} />
        <MetricCard label="Queued Retries" value={queuedRetries} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Resilience Runtime" eyebrow="Hardening control">
          <button disabled={loading} onClick={runResilience} style={buttonStyle}>
            {loading ? "Checking..." : "Run Resilience Check"}
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
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Health Checks" eyebrow="Service status">
            <div style={{ display: "grid", gap: 12 }}>
              {checks.map((check: any) => (
                <div key={check.id} style={cardStyle}>
                  <StatusBadge status={check.status} />
                  <h3>{check.serviceName}</h3>
                  <p>{check.message}</p>
                  <p style={{ color: "#666" }}>
                    {check.serviceType} · {check.latencyMs ?? 0}ms
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Resilience Policies" eyebrow="Hardening rules">
            <div style={{ display: "grid", gap: 12 }}>
              {policies.map((policy: any) => (
                <div key={policy.id} style={cardStyle}>
                  <StatusBadge status={policy.severity} />
                  <h3>{policy.title}</h3>
                  <p style={{ color: "#666" }}>
                    {policy.policyType} · {policy.targetService || "all"}
                  </p>
                  <pre style={preStyle}>{JSON.stringify(policy.action, null, 2)}</pre>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Incidents" eyebrow="Failure intelligence">
            <div style={{ display: "grid", gap: 12 }}>
              {incidents.map((incident: any) => (
                <div key={incident.id} style={cardStyle}>
                  <StatusBadge status={incident.status} />
                  <h3>{incident.title}</h3>
                  <p>{incident.description}</p>
                  <p style={{ color: "#666" }}>
                    {incident.incidentType} · {incident.severity} · {incident.source}
                  </p>

                  {["open", "monitoring"].includes(incident.status) ? (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        disabled={loading}
                        onClick={() => incidentAction(incident.id, "resolve")}
                        style={buttonStyle}
                      >
                        Resolve
                      </button>

                      <button
                        disabled={loading}
                        onClick={() => incidentAction(incident.id, "monitor")}
                        style={secondaryButtonStyle}
                      >
                        Monitor
                      </button>

                      <button
                        disabled={loading}
                        onClick={() => incidentAction(incident.id, "escalate")}
                        style={secondaryButtonStyle}
                      >
                        Escalate
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Retry Queue" eyebrow="Recovery jobs">
            <div style={{ display: "grid", gap: 12 }}>
              {retryJobs.map((job: any) => (
                <div key={job.id} style={cardStyle}>
                  <StatusBadge status={job.status} />
                  <h3>{job.title}</h3>
                  <p>{job.lastError}</p>
                  <p style={{ color: "#666" }}>
                    {job.source} · Attempts {job.attempts}/{job.maxAttempts}
                  </p>

                  {job.status === "queued" ? (
                    <button
                      disabled={loading}
                      onClick={() => retryJob(job.id)}
                      style={buttonStyle}
                    >
                      Run Retry
                    </button>
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

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#fff",
  color: "#111",
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