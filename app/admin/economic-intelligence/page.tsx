"use client"

import { useEffect, useState } from "react"
import {
  PageShell,
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  StatusBadge,
} from "@/components/executive-ui"

export default function EconomicIntelligencePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/economic-intelligence")
    const result = await res.json()

    if (result.ok) {
      setData(result)
    }
  }

  async function runEconomicIntelligence() {
    setLoading(true)

    const res = await fetch("/api/economic-intelligence", {
      method: "POST",
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Economic intelligence run failed")
      return
    }

    await loadData()
  }

  async function activate(type: string, id: string) {
    setLoading(true)

    const res = await fetch("/api/economic-intelligence/activate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, id }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Activation failed")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const latest = data?.runs?.[0]
  const opportunities = data?.opportunities || []
  const campaigns = data?.campaigns || []
  const decisions = data?.decisions || []

  const totalEstimated = opportunities.reduce(
    (sum: number, item: any) => sum + (item.estimatedValue || 0),
    0
  )

  return (
    <PageShell
      eyebrow="Autonomous Economic Intelligence"
      title="Revenue Optimization Sovereign Runtime"
      description="Analyze revenue opportunity, pipeline risk, economic campaigns, pricing insight and monetization strategy across the autonomous organization."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Revenue Health" value={latest?.revenueHealth || 0} />
        <MetricCard label="Opportunity Score" value={latest?.opportunityScore || 0} />
        <MetricCard label="Risk Pressure" value={latest?.riskPressure || 0} />
        <MetricCard label="Opportunities" value={opportunities.length} />
        <MetricCard
          label="Estimated Value"
          value={`AUD ${Math.round(totalEstimated).toLocaleString("en-AU")}`}
        />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Economic Intelligence Runtime" eyebrow="Revenue brain">
          <button
            disabled={loading}
            onClick={runEconomicIntelligence}
            style={buttonStyle}
          >
            {loading ? "Analyzing..." : "Run Economic Intelligence"}
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
          <ExecutiveCard title="Revenue Opportunities" eyebrow="Monetization queue">
            <div style={{ display: "grid", gap: 12 }}>
              {opportunities.map((item: any) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.status} />
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <p style={{ color: "var(--muted)" }}>
                    {item.opportunityType} · AUD{" "}
                    {Math.round(item.estimatedValue || 0).toLocaleString("en-AU")} ·
                    Confidence {Math.round((item.confidence || 0) * 100)}%
                  </p>

                  {item.status === "identified" ? (
                    <button
                      disabled={loading}
                      onClick={() => activate("opportunity", item.id)}
                      style={buttonStyle}
                    >
                      Activate Opportunity
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Economic Campaigns" eyebrow="Revenue campaigns">
            <div style={{ display: "grid", gap: 12 }}>
              {campaigns.map((item: any) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.status} />
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <p style={{ color: "var(--muted)" }}>
                    {item.campaignType} · Goal AUD{" "}
                    {Math.round(item.revenueGoal || 0).toLocaleString("en-AU")}
                  </p>

                  {item.status === "planned" ? (
                    <button
                      disabled={loading}
                      onClick={() => activate("campaign", item.id)}
                      style={buttonStyle}
                    >
                      Activate Campaign
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Economic Decisions" eyebrow="Revenue judgment">
          <div style={{ display: "grid", gap: 12 }}>
            {decisions.map((item: any) => (
              <div key={item.id} style={cardStyle}>
                <StatusBadge status={item.status} />
                <h3>{item.title}</h3>
                <p>{item.rationale}</p>
                <p style={{ color: "var(--muted)" }}>
                  {item.decisionType} · {item.expectedImpact}
                </p>

                {item.status === "proposed" ? (
                  <button
                    disabled={loading}
                    onClick={() => activate("decision", item.id)}
                    style={buttonStyle}
                  >
                    Accept Decision
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

const preStyle: React.CSSProperties = {
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  borderRadius: 14,
  padding: 14,
  overflowX: "auto",
  whiteSpace: "pre-wrap",
}