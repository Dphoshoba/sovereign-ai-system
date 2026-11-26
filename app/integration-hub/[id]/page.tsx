import { getIntegrationHubRegistry } from "../../../lib/gamma/integration-hub-reader"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Integration_HubDetailPage({ params }: PageProps) {
  const { id } = await params
  const registry = await getIntegrationHubRegistry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
        Integration Hub: {id}
      </h1>
      <p style={{ color: "#6b7280" }}>Total integrations: {registry.integrations.length}</p>
      <a href="/integration-hub" style={{ color: "#3b82f6" }}>← Back to Integration Hub</a>
    </main>
  )
}
