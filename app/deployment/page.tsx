import { getDeploymentRegistry } from "../../lib/gamma/deployment-reader"

export const dynamic = "force-dynamic"

export default async function DeploymentPage() {
  const registry = await getDeploymentRegistry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Deployment Engine
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
        Build 118 — Commercial Intelligence Platform
      </p>
      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1rem" }}>
        <p><strong>Total Targets:</strong> {registry.targets.length}</p>
        <p><strong>Active Deployments:</strong> {registry.metrics.activeDeployments}</p>
        <p><strong>Success Rate:</strong> {registry.metrics.successRate}%</p>
        <p><strong>Avg Deploy Time:</strong> {registry.metrics.avgDeployTime}s</p>
        <p><strong>Health Score:</strong> {registry.metrics.healthScore}</p>
      </div>
      <p style={{ marginTop: "1rem", color: "#10b981", fontWeight: 600 }}>
        Deterministic registry loaded.
      </p>
    </main>
  )
}
