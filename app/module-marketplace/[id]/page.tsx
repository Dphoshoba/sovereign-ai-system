import { getModuleMarketplaceRegistry } from "../../../lib/gamma/module-marketplace-reader"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Module_MarketplaceDetailPage({ params }: PageProps) {
  const { id } = await params
  const registry = await getModuleMarketplaceRegistry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
        Marketplace Engine: {id}
      </h1>
      <p style={{ color: "#6b7280" }}>Total modules: {registry.modules.length}</p>
      <a href="/module-marketplace" style={{ color: "#3b82f6" }}>← Back to Marketplace Engine</a>
    </main>
  )
}
