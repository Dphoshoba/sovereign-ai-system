import { getLicenseRegistry } from "../../../lib/gamma/license-reader"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LicensingDetailPage({ params }: PageProps) {
  const { id } = await params
  const registry = await getLicenseRegistry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
        License Engine: {id}
      </h1>
      <p style={{ color: "#6b7280" }}>Total licenses: {registry.licenses.length}</p>
      <a href="/licensing" style={{ color: "#3b82f6" }}>← Back to License Engine</a>
    </main>
  )
}
