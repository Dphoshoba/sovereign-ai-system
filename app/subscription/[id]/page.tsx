import { getSubscriptionRegistry } from "../../../lib/gamma/subscription-reader"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SubscriptionDetailPage({ params }: PageProps) {
  const { id } = await params
  const registry = await getSubscriptionRegistry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
        Subscription Engine: {id}
      </h1>
      <p style={{ color: "#6b7280" }}>Total plans: {registry.plans.length}</p>
      <a href="/subscription" style={{ color: "#3b82f6" }}>← Back to Subscription Engine</a>
    </main>
  )
}
