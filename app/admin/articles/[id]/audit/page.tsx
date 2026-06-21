import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

function scoreColor(score?: number | null) {
  if ((score ?? 0) >= 80) return "#15803d"
  if ((score ?? 0) >= 60) return "#d97706"
  return "#b91c1c"
}

export default async function ArticleAuditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      researchAudits: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },

      reviewNotes: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })
  if (!article) notFound()

  const audit = article.researchAudits[0]

  return (
    <main style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <Link href="/admin/articles">Back to Articles</Link>

      <h1 style={{ marginTop: "20px" }}>Executive Article Audit</h1>
      <h2>{article.title}</h2>

      <div style={grid}>
        <Metric label="Editorial Score" value={article.editorialScore} />
        <Metric label="Quality Score" value={article.qualityScore} />
        <Metric label="SEO Score" value={article.seoScore} />
        <Metric label="Status" value={article.status} />
      </div>

      <div style={grid}>
        <Metric label="Editorial Grade" value={article.editorialGrade} />
        <Metric label="Quality Grade" value={article.qualityGrade} />
        <Metric label="SEO Grade" value={article.seoGrade} />
        <Metric label="Category" value={article.category} />
      </div>

      {!audit ? (
        <div style={card}>
          <h3>No Research Audit</h3>
          <p>No audit record exists for this article.</p>
        </div>
      ) : (
        <>
          <div style={card}>
            <h3>Research Governance</h3>

            <div style={grid}>
              <Metric label="Research Confidence" value={audit.researchConfidence} />
              <Metric label="Authority Score" value={audit.averageAuthorityScore} />
              <Metric label="Trust Score" value={audit.averageTrustScore} />
              <Metric label="Verification Score" value={audit.averageVerificationScore} />
              <Metric label="Consensus Score" value={audit.consensusScore} />
              <Metric label="Source Quality" value={audit.sourceQualityScore} />
            </div>

            <p>
              <strong>Publication Recommendation:</strong>{" "}
              {audit.publicationRecommendation ?? "Not available"}
            </p>
          </div>

          <div style={card}>
            <h3>Evidence Summary</h3>

            <div style={grid}>
              <Metric label="Sources" value={audit.sourceCount} />
              <Metric label="Evidence Records" value={audit.evidenceCount} />
              <Metric label="Facts" value={audit.factCount} />
              <Metric label="Verified" value={audit.verifiedCount} />
              <Metric label="Partially Verified" value={audit.partiallyVerifiedCount} />
              <Metric label="Unverified" value={audit.unverifiedCount} />
            </div>
          </div>
          
          <div style={card}>
            <h3>Review History</h3>

            {article.reviewNotes.length === 0 ? (
              <p>No review history recorded.</p>
            ) : (
              article.reviewNotes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    padding: "12px",
                    marginBottom: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <strong>Action:</strong> {note.action}
                  </div>

                  <div>
                    <strong>Reviewer:</strong> {note.reviewer}
                  </div>

                  <div>
                    <strong>Date:</strong>{" "}
                    {new Date(note.createdAt).toLocaleString()}
                  </div>

                  <div style={{ marginTop: "8px" }}>
                    <strong>Note:</strong>
                    <br />
                    {note.note || "-"}
                  </div>
                </div>
              ))
            )}
          </div>
         

          <JsonCard title="Sources Used" data={audit.sources} />
          <JsonCard title="Evidence Used" data={audit.evidence} />
          <JsonCard title="Facts Extracted" data={audit.facts} />
          <JsonCard title="Consensus Groups" data={audit.consensus} />
        </>
      )}
    </main>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  const isNumber = typeof value === "number"

  return (
    <div style={metric}>
      <div style={{ fontSize: "13px", color: "#666" }}>{label}</div>
      <div
        style={{
          marginTop: "6px",
          fontSize: "22px",
          fontWeight: "bold",
          color: isNumber ? scoreColor(value) : "#111",
        }}
      >
        {value ?? "-"}
      </div>
    </div>
  )
}

function JsonCard({ title, data }: { title: string; data: unknown }) {
  return (
    <div style={card}>
      <h3>{title}</h3>
      <pre style={pre}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
  marginTop: "16px",
}

const card: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "20px",
  marginTop: "20px",
  background: "var(--card)",
}

const metric: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "16px",
  background: "#f8f9fa",
}

const pre: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontSize: "12px",
  overflowX: "auto",
}