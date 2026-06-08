async function getProposals() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const response = await fetch(`${baseUrl}/api/creator-proposals`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Failed to load proposals")
  }

  return response.json()
}

export default async function ProposalsPage() {
  const data = await getProposals()
  const proposals = data.proposals || []

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Creator Proposals</h1>
      <p>Saved AI-generated proposals for consultation leads.</p>

      <section style={{ display: "grid", gap: "16px", marginTop: "24px" }}>
        {proposals.length === 0 && <p>No proposals yet.</p>}

        {proposals.map((proposal: any) => (
          <article key={proposal.id} style={cardStyle}>
            <h2>{proposal.title}</h2>

            <p>
              <strong>Status:</strong> {proposal.status}
            </p>

            <p>
              <strong>Package:</strong> {proposal.packageType || "N/A"}
            </p>

            <p>
              <strong>Estimated Value:</strong>{" "}
              {new Intl.NumberFormat("en-AU", {
                style: "currency",
                currency: "AUD",
              }).format(proposal.estimatedValue || 0)}
            </p>

            <p>
              <strong>Implementation:</strong>{" "}
              {proposal.implementationWeeks || 0} weeks
            </p>

            <p>{proposal.description}</p>

            <details>
              <summary>View Proposal JSON</summary>
              <pre style={preStyle}>{proposal.proposalContent}</pre>
            </details>
          </article>
        ))}
      </section>
    </main>
  )
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "14px",
  padding: "20px",
}

const preStyle: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  background: "#f8fafc",
  padding: "16px",
  borderRadius: "10px",
  overflowX: "auto",
}
