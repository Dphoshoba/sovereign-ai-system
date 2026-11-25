import Link from "next/link"
import { getSchedulerRegistry } from "../../../lib/gamma/scheduler-reader"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await getSchedulerRegistry()

  return (
    <main style={{ maxWidth: 1320, margin: "0 auto", padding: 32 }}>
      <h1>Scheduler: {id}</h1>
      <Link href="/scheduler">Back</Link>
    </main>
  )
}
