import { getDeploymentRegistry } from "../../../lib/gamma/deployment-reader"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DeploymentDetailPage({ params }: PageProps) {
  const { id } = await params
  const registry = await getDeploymentRegistry()
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
        Deployment Engine: {id}
      </h1>
      <p style={{ color: "#6b7280" }}>Total targets: {registry.targets.length}</p>
      <a href="/deployment" style={{ color: "#3b82f6" }}>← Back to Deployment Engine</a>
    </main>
  )
}
