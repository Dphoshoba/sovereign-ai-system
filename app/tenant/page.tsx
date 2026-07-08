import { getTenantRegistry } from "../../lib/gamma/tenant-reader"

export const dynamic = "force-dynamic"

export default async function TenantPage() {
  const registry = await getTenantRegistry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Tenant Engine
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
        Build 111 — Commercial Intelligence Platform
      </p>
      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1rem" }}>
        <p><strong>Total Tenants:</strong> {registry.tenants.length}</p>
        <p><strong>Active Tenants:</strong> {registry.metrics.activeTenants}</p>
        <p><strong>Total Users:</strong> {registry.metrics.totalUsers}</p>
        <p><strong>Health Score:</strong> {registry.metrics.healthScore}</p>
      </div>
      <p style={{ marginTop: "1rem", color: "#10b981", fontWeight: 600 }}>
        Deterministic registry loaded.
      </p>
    </main>
  )
}
