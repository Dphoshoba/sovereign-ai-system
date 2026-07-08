import Link from "next/link"
import { getApiGatewayRegistry } from "../../../lib/gamma/api-gateway-reader"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await getApiGatewayRegistry()

  return (
    <main style={{ maxWidth: 1320, margin: "0 auto", padding: 32 }}>
      <h1>API Gateway: {id}</h1>
      <Link href="/api-gateway">Back</Link>
    </main>
  )
}
