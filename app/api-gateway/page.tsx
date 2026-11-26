import Link from "next/link"
import { getApiGatewayRegistry } from "../../lib/gamma/api-gateway-reader"

export const dynamic = "force-dynamic"

export default async function Page() {
  const registry = await getApiGatewayRegistry()

  return (
    <main style={{ maxWidth: 1320, margin: "0 auto", padding: 32 }}>
      <section style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 16, background: "var(--card-background)", marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 32 }}>API Gateway</h1>
      </section>
      <section style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 16, background: "var(--card-background)" }}>
        <p>Deterministic registry loaded.</p>
      </section>
    </main>
  )
}
