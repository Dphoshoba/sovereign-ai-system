import { getGammaCloudRegistry } from "../../lib/gamma/gamma-cloud-reader"

export const dynamic = "force-dynamic"

export default async function GammaCloudPage() {
  const registry = await getGammaCloudRegistry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Gamma Cloud
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
        Build 120 — Commercial Intelligence Platform
      </p>
      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1rem" }}>
        <p><strong>Organizations:</strong> {registry.metrics.organizations.toLocaleString()}</p>
        <p><strong>Users:</strong> {registry.metrics.users.toLocaleString()}</p>
        <p><strong>AI Agents:</strong> {registry.metrics.aiAgents.toLocaleString()}</p>
        <p><strong>Regions:</strong> {registry.regions.length}</p>
        <p><strong>Revenue:</strong> ${registry.metrics.revenue.toLocaleString()}</p>
        <p><strong>Live Status:</strong> {registry.metrics.liveStatus}</p>
        <p><strong>Health:</strong> {registry.metrics.health}%</p>
      </div>
      <p style={{ marginTop: "1rem", color: "#10b981", fontWeight: 600 }}>
        Deterministic registry loaded.
      </p>
    </main>
  )
}
