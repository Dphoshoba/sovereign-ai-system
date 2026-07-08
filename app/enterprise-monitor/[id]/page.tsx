import Link from "next/link"
import { getEnterpriseMonitorRegistry } from "../../../lib/gamma/enterprise-monitor-reader"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await getEnterpriseMonitorRegistry()

  return (
    <main style={{ maxWidth: 1320, margin: "0 auto", padding: 32 }}>
      <h1>Enterprise Monitor: {id}</h1>
      <Link href="/enterprise-monitor">Back</Link>
    </main>
  )
}
