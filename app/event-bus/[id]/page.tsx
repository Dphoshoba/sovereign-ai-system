import Link from "next/link"
import { getEventBusRegistry } from "../../../lib/gamma/event-bus-reader"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await getEventBusRegistry()

  return (
    <main style={{ maxWidth: 1320, margin: "0 auto", padding: 32 }}>
      <h1>Event Bus: {id}</h1>
      <Link href="/event-bus">Back</Link>
    </main>
  )
}
