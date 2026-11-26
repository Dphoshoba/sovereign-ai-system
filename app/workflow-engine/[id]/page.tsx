import Link from "next/link"
import { getWorkflowEngineRegistry } from "../../../lib/gamma/workflow-engine-reader"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await getWorkflowEngineRegistry()

  return (
    <main style={{ maxWidth: 1320, margin: "0 auto", padding: 32 }}>
      <h1>Workflow Engine: {id}</h1>
      <Link href="/workflow-engine">Back</Link>
    </main>
  )
}
