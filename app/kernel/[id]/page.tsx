import Link from "next/link"
import { getKernelRegistry } from "../../../lib/gamma/kernel-reader"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await getKernelRegistry()

  return (
    <main style={{ maxWidth: 1320, margin: "0 auto", padding: 32 }}>
      <h1>Kernel: {id}</h1>
      <Link href="/kernel">Back</Link>
    </main>
  )
}
