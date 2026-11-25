import { getTenantRegistry } from "../../../lib/gamma/tenant-reader"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TenantDetailPage({ params }: PageProps) {
  const { id } = await params
  const registry = await getTenantRegistry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
        Tenant Engine: {id}
      </h1>
      <p style={{ color: "#6b7280" }}>Total tenants: {registry.tenants.length}</p>
      <a href="/tenant" style={{ color: "#3b82f6" }}>← Back to Tenant Engine</a>
    </main>
  )
}
