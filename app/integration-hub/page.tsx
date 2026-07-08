import { getIntegrationHubRegistry } from "../../lib/gamma/integration-hub-reader"

export const dynamic = "force-dynamic"

export default async function IntegrationHubPage() {
  const registry = await getIntegrationHubRegistry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Integration Hub
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
        Build 117 — Commercial Intelligence Platform
      </p>
      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1rem" }}>
        <p><strong>Total Integrations:</strong> {registry.integrations.length}</p>
        <p><strong>Connected:</strong> {registry.metrics.connectedIntegrations}</p>
        <p><strong>Total Syncs:</strong> {registry.metrics.totalSyncs.toLocaleString()}</p>
        <p><strong>Health Score:</strong> {registry.metrics.healthScore}</p>
      </div>
      <p style={{ marginTop: "1rem", color: "#10b981", fontWeight: 600 }}>
        Deterministic registry loaded.
      </p>
    </main>
  )
}
