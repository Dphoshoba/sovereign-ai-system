import { getSubscriptionRegistry } from "../../lib/gamma/subscription-reader"

export const dynamic = "force-dynamic"

export default async function SubscriptionPage() {
  const registry = await getSubscriptionRegistry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Subscription Engine
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
        Build 113 — Commercial Intelligence Platform
      </p>
      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1rem" }}>
        <p><strong>Total Plans:</strong> {registry.plans.length}</p>
        <p><strong>Total Subscribers:</strong> {registry.metrics.totalSubscribers}</p>
        <p><strong>MRR:</strong> ${registry.metrics.mrr.toLocaleString()}</p>
        <p><strong>Health Score:</strong> {registry.metrics.healthScore}</p>
      </div>
      <p style={{ marginTop: "1rem", color: "#10b981", fontWeight: 600 }}>
        Deterministic registry loaded.
      </p>
    </main>
  )
}
