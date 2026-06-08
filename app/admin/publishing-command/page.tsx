"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

const statuses = [
  "idea",
  "researching",
  "scripting",
  "filming",
  "editing",
  "thumbnail",
  "scheduled",
  "published",
  "repurposed",
]

export default function PublishingCommandPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [topic, setTopic] = useState(
    "How creators and ministries can build sovereign AI systems without chaos"
  )

  async function loadData() {
    const res = await fetch("/api/publishing-command")
    const result = await res.json()
    if (result.ok) setData(result)
  }

  async function runPublishingCommand() {
    setLoading(true)

    try {
      const res = await fetch("/api/publishing-command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic }),
      })

      const result = await res.json()

      if (!result.ok) {
        alert(result.error || "Publishing command failed")
        return
      }

      await loadData()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Publishing command failed")
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(assetId: string, status: string) {
    setLoading(true)

    try {
      const res = await fetch("/api/publishing-command/workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assetId, status }),
      })

      const result = await res.json()

      if (!result.ok) {
        alert(result.error || "Workflow update failed")
        return
      }

      await loadData()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Workflow update failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const goals = data?.goals || []
  const assets = data?.assets || []
  const runs = data?.runs || []
  const subscribers = data?.subscribers || []
  const latest = runs[0]

  const shorts = assets.filter((a: any) => a.assetType === "short").length
  const longform = assets.filter((a: any) => a.assetType === "long-form").length
  const newsletters = assets.filter((a: any) => a.assetType === "newsletter").length
  const leadMagnets = assets.filter((a: any) => a.assetType === "lead-magnet").length

  return (
    <PageShell
      eyebrow="YouTube Intelligence Runtime"
      title="Publishing Command Center"
      description="Protect cadence, generate YouTube assets, plan newsletters, build lead magnets and drive the Echoes & Visions sovereign ecosystem flywheel."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Assets" value={assets.length} />
        <MetricCard label="Shorts" value={shorts} />
        <MetricCard label="Long-form" value={longform} />
        <MetricCard label="Newsletters" value={newsletters} />
        <MetricCard label="Lead Magnets" value={leadMagnets} />
        <MetricCard label="Subscribers" value={subscribers.length} />
        <MetricCard label="Cadence Score" value={latest?.cadenceScore || 0} />
        <MetricCard label="Funnel Score" value={latest?.funnelScore || 0} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Generate Publishing Assets" eyebrow="Cadence engine">
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={5}
              style={inputStyle}
            />

            <button
              disabled={loading}
              onClick={runPublishingCommand}
              style={buttonStyle}
            >
              {loading ? "Generating..." : "Run Publishing Command"}
            </button>

            {latest ? (
              <div style={cardStyle}>
                <StatusBadge status={latest.status} />
                <h3>{latest.title}</h3>
                <p>{latest.summary}</p>
                <pre style={preStyle}>
                  {JSON.stringify(latest.findings, null, 2)}
                </pre>
              </div>
            ) : null}
          </ExecutiveCard>

          <ExecutiveCard title="Cadence Goals" eyebrow="Consistency beats intensity">
            <div style={{ display: "grid", gap: 12 }}>
              {goals.map((goal: any) => (
                <div key={goal.id} style={cardStyle}>
                  <StatusBadge status={goal.status} />
                  <h3>{goal.title}</h3>
                  <p style={{ color: "var(--muted)" }}>
                    {goal.target} / {goal.period} · {goal.channel}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Publishing Pipeline" eyebrow="Idea to published">
          <div style={{ display: "grid", gap: 12 }}>
            {assets.map((asset: any) => (
              <div key={asset.id} style={cardStyle}>
                <StatusBadge status={asset.status} />
                <h3>{asset.title}</h3>
                <p>
                  <strong>Hook:</strong> {asset.hook}
                </p>
                <p>
                  <strong>Thumbnail:</strong> {asset.thumbnailIdea}
                </p>
                <p style={{ color: "var(--muted)" }}>
                  {asset.assetType} · {asset.pillar} · Score {asset.score}/100
                </p>
                <p>
                  <strong>CTA:</strong> {asset.cta}
                </p>

                <select
                  value={asset.status}
                  onChange={(e) => updateStatus(asset.id, e.target.value)}
                  style={inputStyle}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </ExecutiveCard>
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