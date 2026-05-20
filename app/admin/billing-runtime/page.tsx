"use client"

import { useEffect, useState } from "react"
import {
  ExecutiveCard,
  ExecutiveGrid,
  MetricCard,
  PageShell,
  StatusBadge,
} from "@/components/executive-ui"

export default function BillingRuntimePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function loadData() {
    const res = await fetch("/api/billing-runtime")
    const result = await res.json()

    if (result.ok) setData(result)
  }

  async function runBillingIntelligence() {
    setLoading(true)

    const res = await fetch("/api/billing-runtime", {
      method: "POST",
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Billing intelligence failed")
      return
    }

    await loadData()
  }

  async function meterUsage() {
    const orgId = data?.subscriptions?.[0]?.organizationId

    if (!orgId) {
      alert("No organization found")
      return
    }

    setLoading(true)

    const res = await fetch("/api/billing-runtime/meter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organizationId: orgId,
        meterType: "aiRuns",
        quantity: 1,
        unit: "run",
        sourceLayer: "billing-runtime-test",
        costAud: 0.02,
        metadata: {
          test: true,
        },
      }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Usage metering failed")
      return
    }

    await loadData()
  }

  async function changePlan(planSlug: string) {
    const orgId = data?.subscriptions?.[0]?.organizationId

    if (!orgId) {
      alert("No organization found")
      return
    }

    setLoading(true)

    const res = await fetch("/api/billing-runtime/subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organizationId: orgId,
        planSlug,
      }),
    })

    const result = await res.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Plan change failed")
      return
    }

    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  const plans = data?.plans || []
  const subscriptions = data?.subscriptions || []
  const usageEvents = data?.usageEvents || []
  const quotas = data?.quotas || []
  const invoices = data?.invoices || []
  const latest = data?.runs?.[0]

  const totalUsageCost = usageEvents.reduce(
    (sum: number, item: any) => sum + (item.costAud || 0),
    0
  )

  const quotaWarnings = quotas.filter((q: any) =>
    ["near-limit", "limit-reached"].includes(q.status)
  ).length

  return (
    <PageShell
      eyebrow="Economic Sustainability Runtime"
      title="Sovereign Billing + Usage Metering"
      description="Manage tenant plans, subscriptions, usage metering, quotas, invoices, AI cost accounting and billing intelligence."
    >
      <ExecutiveGrid min={220}>
        <MetricCard label="Plans" value={plans.length} />
        <MetricCard label="Subscriptions" value={subscriptions.length} />
        <MetricCard label="Usage Events" value={usageEvents.length} />
        <MetricCard label="Quota Warnings" value={quotaWarnings} />
        <MetricCard label="Invoices" value={invoices.length} />
        <MetricCard
          label="Usage Cost"
          value={`AUD ${totalUsageCost.toFixed(2)}`}
        />
      </ExecutiveGrid>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Billing Intelligence" eyebrow="Revenue control">
            <button
              disabled={loading}
              onClick={runBillingIntelligence}
              style={buttonStyle}
            >
              {loading ? "Analyzing..." : "Run Billing Intelligence"}
            </button>

            {latest ? (
              <div style={cardStyle}>
                <StatusBadge status={latest.status} />
                <h3>{latest.title}</h3>
                <p>{latest.summary}</p>
                <p style={{ color: "#666" }}>
                  Revenue {latest.revenueHealth}/100 · Usage{" "}
                  {latest.usageHealth}/100 · Quota Risk {latest.quotaRisk}/100 ·
                  Cost Risk {latest.costRisk}/100
                </p>
                <pre style={preStyle}>{JSON.stringify(latest.findings, null, 2)}</pre>
              </div>
            ) : null}
          </ExecutiveCard>

          <ExecutiveCard title="Meter Usage" eyebrow="Usage tracking">
            <p>
              Add a test <strong>aiRuns</strong> usage event for the active
              organization.
            </p>

            <button disabled={loading} onClick={meterUsage} style={buttonStyle}>
              Add Test AI Run Usage
            </button>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Billing Plans" eyebrow="Subscription tiers">
          <ExecutiveGrid min={280}>
            {plans.map((plan: any) => (
              <div key={plan.id} style={cardStyle}>
                <StatusBadge status={plan.status} />
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
                <h2>AUD {plan.priceAud}/mo</h2>
                <pre style={preStyle}>{JSON.stringify(plan.limits, null, 2)}</pre>

                <button
                  disabled={loading}
                  onClick={() => changePlan(plan.slug)}
                  style={buttonStyle}
                >
                  Switch to {plan.name}
                </button>
              </div>
            ))}
          </ExecutiveGrid>
        </ExecutiveCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveGrid min={360}>
          <ExecutiveCard title="Subscriptions" eyebrow="Tenant billing state">
            <div style={{ display: "grid", gap: 12 }}>
              {subscriptions.map((item: any) => (
                <div key={item.id} style={cardStyle}>
                  <StatusBadge status={item.status} />
                  <h3>{item.planSlug}</h3>
                  <p style={{ color: "#666" }}>
                    Org {item.organizationId} · Cancel at period end:{" "}
                    {String(item.cancelAtPeriodEnd)}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Quota State" eyebrow="Usage limits">
            <div style={{ display: "grid", gap: 12 }}>
              {quotas.map((quota: any) => (
                <div key={quota.id} style={cardStyle}>
                  <StatusBadge status={quota.status} />
                  <h3>{quota.meterType}</h3>
                  <p>
                    {quota.usedValue}/{quota.limitValue} used
                  </p>
                  <p style={{ color: "#666" }}>
                    Reset:{" "}
                    {quota.resetAt
                      ? new Date(quota.resetAt).toLocaleString("en-AU")
                      : "Not set"}
                  </p>
                </div>
              ))}
            </div>
          </ExecutiveCard>
        </ExecutiveGrid>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExecutiveCard title="Usage Events" eyebrow="Metered activity">
          <div style={{ display: "grid", gap: 12 }}>
            {usageEvents.map((event: any) => (
              <div key={event.id} style={cardStyle}>
                <StatusBadge status={event.meterType} />
                <h3>{event.meterType}</h3>
                <p style={{ color: "#666" }}>
                  Qty {event.quantity} {event.unit} · Cost AUD{" "}
                  {(event.costAud || 0).toFixed(4)} · {event.sourceLayer}
                </p>
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