import { getAnalyticsRegistry } from "../../lib/gamma/analytics-reader"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const registry = await getAnalyticsRegistry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Analytics Engine
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
        Build 119 — Commercial Intelligence Platform
      </p>
      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1rem" }}>
        <p><strong>Revenue (ARR):</strong> ${registry.commercial.arr.toLocaleString()}</p>
        <p><strong>MRR:</strong> ${registry.commercial.mrr.toLocaleString()}</p>
        <p><strong>User Growth:</strong> {registry.commercial.userGrowth}%</p>
        <p><strong>Mission Health:</strong> {registry.commercial.missionHealth}%</p>
        <p><strong>Metrics Tracked:</strong> {registry.metrics.length}</p>
        <p><strong>Health Score:</strong> {registry.healthScore}</p>
      </div>
      <p style={{ marginTop: "1rem", color: "#10b981", fontWeight: 600 }}>
        Deterministic registry loaded.
      </p>
    </main>
  )
}
