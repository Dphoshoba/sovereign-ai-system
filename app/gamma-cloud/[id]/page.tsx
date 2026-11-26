import { getGammaCloudRegistry } from "../../../lib/gamma/gamma-cloud-reader"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Gamma_CloudDetailPage({ params }: PageProps) {
  const { id } = await params
  const registry = await getGammaCloudRegistry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
        Gamma Cloud: {id}
      </h1>
      <p style={{ color: "#6b7280" }}>Total regions: {registry.regions.length}</p>
      <a href="/gamma-cloud" style={{ color: "#3b82f6" }}>← Back to Gamma Cloud</a>
    </main>
  )
}
