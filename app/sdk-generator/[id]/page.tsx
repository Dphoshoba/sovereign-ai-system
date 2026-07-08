import Link from "next/link"
import { getSdkGeneratorRegistry } from "../../../lib/gamma/sdk-generator-reader"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await getSdkGeneratorRegistry()

  return (
    <main style={{ maxWidth: 1320, margin: "0 auto", padding: 32 }}>
      <h1>SDK Generator: {id}</h1>
      <Link href="/sdk-generator">Back</Link>
    </main>
  )
}
