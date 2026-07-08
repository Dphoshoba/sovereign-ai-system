import { getAiMarketplaceRegistry } from "../../../lib/gamma/ai-marketplace-reader"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Ai_MarketplaceDetailPage({ params }: PageProps) {
  const { id } = await params
  const registry = await getAiMarketplaceRegistry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
        AI Agent Marketplace: {id}
      </h1>
      <p style={{ color: "#6b7280" }}>Total agents: {registry.agents.length}</p>
      <a href="/ai-marketplace" style={{ color: "#3b82f6" }}>← Back to AI Agent Marketplace</a>
    </main>
  )
}
