import { getAiMarketplaceRegistry } from "../../lib/gamma/ai-marketplace-reader"

export const dynamic = "force-dynamic"

export default async function AiMarketplacePage() {
  const registry = await getAiMarketplaceRegistry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        AI Agent Marketplace
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
        Build 116 — Commercial Intelligence Platform
      </p>
      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1rem" }}>
        <p><strong>Total Agents:</strong> {registry.agents.length}</p>
        <p><strong>Deployed Agents:</strong> {registry.metrics.deployedAgents}</p>
        <p><strong>Total Deployments:</strong> {registry.metrics.totalDeployments.toLocaleString()}</p>
        <p><strong>Health Score:</strong> {registry.metrics.healthScore}</p>
      </div>
      <p style={{ marginTop: "1rem", color: "#10b981", fontWeight: 600 }}>
        Deterministic registry loaded.
      </p>
    </main>
  )
}
