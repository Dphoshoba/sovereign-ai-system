"use client"

import { useEffect, useState } from "react"
import {
  PageShell,
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  StatusBadge,
} from "@/components/executive-ui"

type Source = {
  id: string
  name: string
  sourceType: string
  category: string
  enabled: boolean
  scanCadence: string
}

type Signal = {
  id: string
  sourceName: string
  signalType: string
  category: string
  title: string
  summary: string | null
  relevanceScore: number
  severity: string
  opportunity: boolean
  risk: boolean
  status: string
}

type Scan = {
  id: string
  title: string
  scanType: string
  status: string
  summary: string | null
  findings: any
  createdAt: string
}

export default function GlobalIntelligencePage() {
  const [sources, setSources] = useState<Source[]>([])
  const [signals, setSignals] = useState<Signal[]>([])
  const [scans, setScans] = useState<Scan[]>([])
  const [scanType, setScanType] = useState("creator-ai-market")
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/global-intelligence")
    const result = await res.json()

    if (result.ok) {
      setSources(result.sources)
      setSignals(result.signals)
      setScans(result.scans)
    }
  }

  async function runScan() {
    setLoading(true)

    const res = await fetch("/api/global-intelligence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scanType }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "External scan failed")
      return
    }

    await loadData()
  }

  async function signalAction(signalId: string, action: string) {
    setLoading(true)

    const res = await fetch("/api/global-intelligence/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ signalId, action }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Signal action failed")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const opportunities = signals.filter((s) => s.opportunity).length
  const risks = signals.filter((s) => s.risk).length
  const highRelevance = signals.filter((s) => s.relevanceScore >= 80).length
  const newSignals = signals.filter((s) => s.status === "new").length
  const latestScan = scans[0]

  return (
    <PageShell
      eyebrow="External World Awareness"
      title="Global Intelligence Mesh"
      description="Monitor external markets, creator economy signals, AI automation trends, competitor movement and strategic opportunities."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Sources" value={sources.length} />
        <MetricCard label="New Signals" value={newSignals} />
        <MetricCard label="Opportunities" value={opportunities} />
        <MetricCard label="Risks" value={risks} />
        <MetricCard label="High Relevance" value={highRelevance} />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="External Scan Control" eyebrow="World awareness">
          <select
            value={scanType}
            onChange={(e) => setScanType(e.target.value)}
            style={inputStyle}
          >
            <option value="creator-ai-market">Creator + AI Market</option>
            <option value="competitor-watch">Competitor Watch</option>
            <option value="saas-positioning">SaaS Positioning</option>
            <option value="creator-economy-risk">Creator Economy Risk</option>
            <option value="automation-opportunity">Automation Opportunity</option>
          </select>

          <button disabled={loading} onClick={runScan} style={buttonStyle}>
            {loading ? "Scanning..." : "Run External World Scan"}
          </button>

          {latestScan ? (
            <div style={cardStyle}>
              <StatusBadge status={latestScan.status} />
              <h3>{latestScan.title}</h3>
              <p>{latestScan.summary}</p>
              <p style={{ color: "#777", fontSize: 12 }}>
                {latestScan.scanType} ·{" "}
                {new Date(latestScan.createdAt).toLocaleString("en-AU")}
              </p>
            </div>
          ) : null}
        </ExecutiveCard>
      </div>

      {latestScan?.findings ? (
        <div style={{ marginTop: 24 }}>
          <ExecutiveGrid min={320}>
            <Finding title="Market Opportunities" items={latestScan.findings.marketOpportunities} />
            <Finding title="External Risks" items={latestScan.findings.externalRisks} />
            <Finding title="Competitor Signals" items={latestScan.findings.competitorSignals} />
            <Finding title="Creator Economy Signals" items={latestScan.findings.creatorEconomySignals} />
            <Finding title="Strategic Implications" items={latestScan.findings.strategicImplications} />
          </ExecutiveGrid>
        </div>
      ) : null}

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="External Intelligence Signals" eyebrow="Signal stream">
            <div style={{ display: "grid", gap: 12 }}>
              {signals.map((signal) => (
                <div key={signal.id} style={cardStyle}>
                  <StatusBadge status={signal.severity} />
                  <h3>{signal.title}</h3>
                  <p>{signal.summary}</p>
                  <p style={{ color: "#666" }}>
                    {signal.sourceName} · {signal.signalType} · Relevance{" "}
                    {signal.relevanceScore}/100
                  </p>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {signal.status === "new" ? (
                      <>
                        <button
                          disabled={loading}
                          onClick={() => signalAction(signal.id, "convert-to-strategy")}
                          style={buttonStyle}
                        >
                          Convert to Strategy
                        </button>

                        <button
                          disabled={loading}
                          onClick={() => signalAction(signal.id, "store-memory")}
                          style={secondaryButtonStyle}
                        >
                          Store Memory
                        </button>

                        <button
                          disabled={loading}
                          onClick={() => signalAction(signal.id, "dismiss")}
                          style={secondaryButtonStyle}
                        >
                          Dismiss
                        </button>
                      </>
                    ) : (
                      <StatusBadge status={signal.status} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Signal Sources" eyebrow="External inputs">
            <div style={{ display: "grid", gap: 12 }}>
              {sources.map((source) => (
                <div key={source.id} style={cardStyle}>
                  <StatusBadge status={source.enabled ? "active" : "disabled"} />
                  <h3>{source.name}</h3>
                  <p style={{ color: "#666" }}>
                    {source.category} · {source.sourceType} · {source.scanCadence}
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

function Finding({ title, items }: { title: string; items?: string[] }) {
  return (
    <ExecutiveCard title={title} eyebrow="External finding">
      <ul style={{ lineHeight: 1.8, paddingLeft: 20 }}>
        {(items || []).map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </ExecutiveCard>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 300,
  borderRadius: 12,
  border: "1px solid #ddd",
  padding: 12,
  marginRight: 12,
  marginBottom: 12,
  fontFamily: "inherit",
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
  marginTop: 14,
  background: "#fafafa",
}