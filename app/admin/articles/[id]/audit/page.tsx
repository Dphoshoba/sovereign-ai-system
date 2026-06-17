import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

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
    },
  })

  if (!article) {
    notFound()
  }

  const audit = article.researchAudits[0]

  if (!audit) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Research Audit</h1>
        <p>No audit record exists for this article.</p>

        <Link href="/admin/articles">
          Back to Articles
        </Link>
      </main>
    )
  }

  return (
    <main
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <Link href="/admin/articles">
         Back to Articles
      </Link>

      <h1 style={{ marginTop: "20px" }}>
        Research Audit
      </h1>

      <h2>{article.title}</h2>

      <div style={card}>
        <h3>Research Scores</h3>

        <p>
          <strong>Research Confidence:</strong>{" "}
          {audit.researchConfidence}
        </p>

        <p>
          <strong>Authority Score:</strong>{" "}
          {audit.averageAuthorityScore}
        </p>

        <p>
          <strong>Trust Score:</strong>{" "}
          {audit.averageTrustScore}
        </p>

        <p>
          <strong>Verification Score:</strong>{" "}
          {audit.averageVerificationScore}
        </p>

        <p>
          <strong>Consensus Score:</strong>{" "}
          {audit.consensusScore}
        </p>

        <p>
          <strong>Sources:</strong>{" "}
          {audit.sourceCount}
        </p>

        <p>
          <strong>Evidence Records:</strong>{" "}
          {audit.evidenceCount}
        </p>

        <p>
          <strong>Facts:</strong>{" "}
          {audit.factCount}
        </p>

        <p>
          <strong>Verified:</strong>{" "}
          {audit.verifiedCount}
        </p>

        <p>
          <strong>Partially Verified:</strong>{" "}
          {audit.partiallyVerifiedCount}
        </p>

        <p>
          <strong>Unverified:</strong>{" "}
          {audit.unverifiedCount}
        </p>

        <p>
          <strong>Recommendation:</strong>{" "}
          {audit.publicationRecommendation}
        </p>
      </div>

      <div style={card}>
        <h3>Sources</h3>

        <pre style={pre}>
          {JSON.stringify(audit.sources, null, 2)}
        </pre>
      </div>

      <div style={card}>
        <h3>Evidence</h3>

        <pre style={pre}>
          {JSON.stringify(audit.evidence, null, 2)}
        </pre>
      </div>

      <div style={card}>
        <h3>Facts</h3>

        <pre style={pre}>
          {JSON.stringify(audit.facts, null, 2)}
        </pre>
      </div>

      <div style={card}>
        <h3>Consensus</h3>

        <pre style={pre}>
          {JSON.stringify(audit.consensus, null, 2)}
        </pre>
      </div>
    </main>
  )
}

const card: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "20px",
  marginTop: "20px",
}

const pre: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontSize: "12px",
  overflowX: "auto",
}