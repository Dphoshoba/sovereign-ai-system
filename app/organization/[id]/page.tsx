import { getOrganizationRegistry } from "../../../lib/gamma/organization-reader"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrganizationDetailPage({ params }: PageProps) {
  const { id } = await params
  const registry = await getOrganizationRegistry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
        Organization Engine: {id}
      </h1>
      <p style={{ color: "#6b7280" }}>Total organizations: {registry.organizations.length}</p>
      <a href="/organization" style={{ color: "#3b82f6" }}>← Back to Organization Engine</a>
    </main>
  )
}
