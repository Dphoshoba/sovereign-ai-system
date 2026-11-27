import Link from "next/link"
import { getPermissionsRegistry } from "../../../lib/gamma/permissions-reader"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await getPermissionsRegistry()

  return (
    <main style={{ maxWidth: 1320, margin: "0 auto", padding: 32 }}>
      <h1>Permissions: {id}</h1>
      <Link href="/permissions">Back</Link>
    </main>
  )
}
