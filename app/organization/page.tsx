import { getOrganizationRegistry } from "../../lib/gamma/organization-reader"

export const dynamic = "force-dynamic"

export default async function OrganizationPage() {
  const registry = await getOrganizationRegistry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Organization Engine
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
        Build 112 — Commercial Intelligence Platform
      </p>
      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1rem" }}>
        <p><strong>Total Organizations:</strong> {registry.organizations.length}</p>
        <p><strong>Active Organizations:</strong> {registry.metrics.activeOrganizations}</p>
        <p><strong>Health Score:</strong> {registry.metrics.healthScore}</p>
      </div>
      <p style={{ marginTop: "1rem", color: "#10b981", fontWeight: 600 }}>
        Deterministic registry loaded.
      </p>
    </main>
  )
}
