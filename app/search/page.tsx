import Link from "next/link"
import { getGammaSearchResults } from "../../lib/gamma/search-reader"

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = (q ?? "").trim()
  const results = await getGammaSearchResults(query)

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Search</p>
        <h1 style={titleStyle}>Cross Mission Search</h1>
        <p style={mutedStyle}>Use query params like /search?q=motherhood or /search?q=oxytocin.</p>
        <p style={mutedStyle}>Current query: {query || "(none)"}</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Results Count" value={String(results.resultsCount)} />
        <Metric label="Mission Count" value={String(results.missionCount)} />
        <Metric label="Workspace Count" value={String(results.workspaceCount)} />
        <Metric label="Coverage Score" value={`${results.coverageScore}%`} />
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Matched Assets</h2>
        {results.matchedAssets.length === 0 ? (
          <p style={mutedStyle}>No results yet. Try motherhood, oxytocin, Deborah, Hannah, or compassion.</p>
        ) : (
          <div style={stackStyle}>
            {results.matchedAssets.slice(0, 30).map((item) => (
              <div key={item.id} style={itemRowStyle}>
                <strong>{item.title}</strong>
                <span style={mutedStyle}>{item.workspace} / {item.mission}</span>
                <span style={mutedStyle}>{item.source}</span>
                <p style={snippetStyle}>{item.snippet}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={cardStyle}>
        <Link href={query ? `/search/results?q=${encodeURIComponent(query)}` : "/search/results"} style={linkStyle}>
          Open detailed results route
        </Link>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article style={metricStyle}>
      <p style={metricLabelStyle}>{label}</p>
      <p style={metricValueStyle}>{value}</p>
    </article>
  )
}

const pageStyle: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: 32, color: "var(--foreground)" }
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 10, padding: 16, background: "var(--card-background)", marginBottom: 14 }
const eyebrowStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8 }
const titleStyle: React.CSSProperties = { margin: "6px 0", fontSize: 32 }
const mutedStyle: React.CSSProperties = { margin: "5px 0", color: "var(--muted)" }
const sectionTitleStyle: React.CSSProperties = { margin: 0, fontSize: 18 }
const metricsStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }
const metricStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--background)" }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontWeight: 700, fontSize: 20 }
const stackStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }
const itemRowStyle: React.CSSProperties = { borderTop: "1px solid var(--border)", paddingTop: 8 }
const snippetStyle: React.CSSProperties = { margin: "6px 0 0", lineHeight: 1.5 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }
