import Link from "next/link"
import { getRegistryRegistry } from "../../../lib/gamma/registry-reader"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await getRegistryRegistry()

  return (
    <main style={{ maxWidth: 1320, margin: "0 auto", padding: 32 }}>
      <h1>Registry: {id}</h1>
      <Link href="/registry">Back</Link>
    </main>
  )
}
