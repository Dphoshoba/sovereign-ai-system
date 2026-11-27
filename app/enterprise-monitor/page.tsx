import Link from "next/link"
import { getEnterpriseMonitorRegistry } from "../../lib/gamma/enterprise-monitor-reader"

export const dynamic = "force-dynamic"

export default async function Page() {
  const registry = await getEnterpriseMonitorRegistry()

  return (
    <main style={{ maxWidth: 1320, margin: "0 auto", padding: 32 }}>
      <section style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 16, background: "var(--card-background)", marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 32 }}>Enterprise Monitor</h1>
      </section>
      <section style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 16, background: "var(--card-background)" }}>
        <p>Deterministic registry loaded.</p>
      </section>
    </main>
  )
}
