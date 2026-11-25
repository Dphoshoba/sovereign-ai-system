import { getAnalyticsRegistry } from "../../../lib/gamma/analytics-reader"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AnalyticsDetailPage({ params }: PageProps) {
  const { id } = await params
  const registry = await getAnalyticsRegistry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
        Analytics Engine: {id}
      </h1>
      <p style={{ color: "#6b7280" }}>Total metrics: {registry.metrics.length}</p>
      <a href="/analytics" style={{ color: "#3b82f6" }}>← Back to Analytics Engine</a>
    </main>
  )
}
