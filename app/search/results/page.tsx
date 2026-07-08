import Link from "next/link"
import { getGammaSearchResults } from "../../../lib/gamma/search-reader"

export const dynamic = "force-dynamic"

export default async function SearchResultsPage({
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
        <p style={eyebrowStyle}>Search Results</p>
        <h1 style={titleStyle}>Results for {query || "(empty query)"}</h1>
        <p style={mutedStyle}>Read-only deterministic search across all Gamma workspaces.</p>
      </section>

      <section style={metricsStyle}>
        <Metric label="Results Count" value={String(results.resultsCount)} />
        <Metric label="Mission Count" value={String(results.missionCount)} />
        <Metric label="Workspace Count" value={String(results.workspaceCount)} />
        <Metric label="Coverage Score" value={`${results.coverageScore}%`} />
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Matched Assets</h2>
        <div style={stackStyle}>
          {results.matchedAssets.map((item) => (
            <article key={item.id} style={itemStyle}>
              <strong>{item.title}</strong>
              <p style={mutedStyle}>Mission: {item.mission}</p>
              <p style={mutedStyle}>Workspace: {item.workspace}</p>
              <p style={mutedStyle}>Source: {item.source}</p>
              <p style={snippetStyle}>{item.snippet}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={cardStyle}>
        <Link href={query ? `/search?q=${encodeURIComponent(query)}` : "/search"} style={linkStyle}>
          Back to Search
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
const titleStyle: React.CSSProperties = { margin: "6px 0", fontSize: 30 }
const mutedStyle: React.CSSProperties = { margin: "5px 0", color: "var(--muted)" }
const sectionTitleStyle: React.CSSProperties = { margin: 0, fontSize: 18 }
const metricsStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }
const metricStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--background)" }
const metricLabelStyle: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" }
const metricValueStyle: React.CSSProperties = { margin: "6px 0 0", fontWeight: 700, fontSize: 20 }
const stackStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }
const itemStyle: React.CSSProperties = { borderTop: "1px solid var(--border)", paddingTop: 8 }
const snippetStyle: React.CSSProperties = { margin: "6px 0 0", lineHeight: 1.5 }
const linkStyle: React.CSSProperties = { color: "#0284c7", textDecoration: "none", fontWeight: 600 }

