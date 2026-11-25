import Link from "next/link"
import { getPluginSystemRegistry } from "../../../lib/gamma/plugin-system-reader"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await getPluginSystemRegistry()

  return (
    <main style={{ maxWidth: 1320, margin: "0 auto", padding: 32 }}>
      <h1>Plugin System: {id}</h1>
      <Link href="/plugin-system">Back</Link>
    </main>
  )
}
