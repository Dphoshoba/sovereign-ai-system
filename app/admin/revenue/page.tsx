"use client"

import { useEffect, useState } from "react"

type RevenueRecord = {
  id: string
  source: string
  category: string
  clientName: string | null
  amount: number
  currency: string
  recurring: boolean
  status: string
  notes: string | null
}

type RevenueInsight = {
  id: string
  title: string
  insight: string
  priority: string
  confidence: number | null
}

export default function RevenuePage() {
  const [records, setRecords] = useState<RevenueRecord[]>([])
  const [insights, setInsights] = useState<RevenueInsight[]>([])
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    source: "YouTube",
    category: "AI Automation",
    clientName: "",
    amount: "",
    currency: "AUD",
    recurring: false,
    status: "received",
    notes: "",
  })

  async function loadRevenue() {
    const response = await fetch("/api/ai/revenue")
    const result = await response.json()

    if (result.ok) {
      setRecords(result.records)
      setInsights(result.insights)
      setMetrics(result.metrics)
    }
  }

  async function saveRevenue(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    const response = await fetch("/api/ai/revenue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to save revenue")
      return
    }

    setForm({
      source: "YouTube",
      category: "AI Automation",
      clientName: "",
      amount: "",
      currency: "AUD",
      recurring: false,
      status: "received",
      notes: "",
    })

    loadRevenue()
  }

  async function generateInsights() {
    setLoading(true)

    const response = await fetch("/api/ai/revenue/analyze", {
      method: "POST",
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to generate insights")
      return
    }

    loadRevenue()
  }

  useEffect(() => {
    loadRevenue()
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>AI CFO</p>

        <h1 style={{ fontSize: 42, margin: "8px 0" }}>
          Revenue Operations Intelligence
        </h1>

        <p style={{ color: "#ddd", maxWidth: 820, lineHeight: 1.7 }}>
          Track revenue streams, recurring income, monetization performance and
          AI-generated strategic business insights.
        </p>
      </section>

      {metrics ? (
        <section style={metricsGrid}>
          <div style={metricCard}>
            <p style={metaStyle}>Total Revenue</p>
            <h2>
              AUD {metrics.totalRevenue.toLocaleString("en-AU")}
            </h2>
          </div>

          <div style={metricCard}>
            <p style={metaStyle}>Recurring Revenue</p>
            <h2>
              AUD {metrics.recurringRevenue.toLocaleString("en-AU")}
            </h2>
          </div>

          <div style={metricCard}>
            <p style={metaStyle}>Revenue Streams</p>
            <h2>
              {Object.keys(metrics.revenueBySource || {}).length}
            </h2>
          </div>
        </section>
      ) : null}

      <form onSubmit={saveRevenue} style={formStyle}>
        <label>
          Revenue Source
          <input
            value={form.source}
            onChange={(e) =>
              setForm({ ...form, source: e.target.value })
            }
            style={inputStyle}
          />
        </label>

        <label>
          Category
          <input
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
            style={inputStyle}
          />
        </label>

        <label>
          Client Name
          <input
            value={form.clientName}
            onChange={(e) =>
              setForm({ ...form, clientName: e.target.value })
            }
            style={inputStyle}
          />
        </label>

        <label>
          Amount
          <input
            type="number"
            value={form.amount}
            onChange={(e) =>
              setForm({ ...form, amount: e.target.value })
            }
            style={inputStyle}
          />
        </label>

        <label style={checkboxStyle}>
          <input
            type="checkbox"
            checked={form.recurring}
            onChange={(e) =>
              setForm({ ...form, recurring: e.target.checked })
            }
          />
          Recurring Revenue
        </label>

        <button disabled={loading} style={buttonStyle}>
          {loading ? "Saving..." : "Save Revenue"}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={generateInsights}
          style={secondaryButton}
        >
          Generate AI Insights
        </button>
      </form>

      <section style={{ marginTop: 40 }}>
        <h2>Revenue Insights</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {insights.map((insight) => (
            <div key={insight.id} style={cardStyle}>
              <p style={metaStyle}>
                {insight.priority} priority
              </p>

              <h3>{insight.title}</h3>

              <p style={{ lineHeight: 1.7 }}>
                {insight.insight}
              </p>

              {insight.confidence ? (
                <p>
                  <strong>Confidence:</strong>{" "}
                  {Math.round(insight.confidence * 100)}%
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Revenue Records</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {records.map((record) => (
            <div key={record.id} style={cardStyle}>
              <p style={metaStyle}>
                {record.source} · {record.category}
              </p>

              <h3>
                {record.currency}{" "}
                {record.amount.toLocaleString("en-AU")}
              </h3>

              {record.clientName ? (
                <p>
                  <strong>Client:</strong> {record.clientName}
                </p>
              ) : null}

              <p>
                <strong>Status:</strong> {record.status}
              </p>

              <p>
                <strong>Recurring:</strong>{" "}
                {record.recurring ? "Yes" : "No"}
              </p>

              {record.notes ? (
                <p>{record.notes}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
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

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
  marginTop: 28,
}

const metricCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
  maxWidth: 840,
  marginTop: 28,
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #ccc",
  fontSize: 16,
}

const checkboxStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  fontWeight: "bold",
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

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#777",
  fontSize: 13,
  margin: 0,
}