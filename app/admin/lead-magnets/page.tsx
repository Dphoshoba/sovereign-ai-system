import { connection } from "next/server"
import { prisma } from "@/lib/prisma"
import LeadMagnetForm from "@/components/lead-magnets/LeadMagnetForm"

export default async function LeadMagnetsPage() {
  await connection()

  const leadMagnets = await prisma.leadMagnet.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Lead Magnets</h1>
      <p>Create and manage downloadable lead magnets for subscriber growth.</p>

      <LeadMagnetForm />

      <section>
        <h2>All Lead Magnets</h2>

        {leadMagnets.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No lead magnets yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
            {leadMagnets.map((magnet) => (
              <div key={magnet.id} style={cardStyle}>
                <h3 style={{ margin: 0 }}>{magnet.title}</h3>
                <p>{magnet.description}</p>
                <p>
                  <strong>Status:</strong> {magnet.status}
                </p>
                <p>
                  <strong>Downloads:</strong> {magnet.downloads}
                </p>
                <p>
                  <strong>Subscribers:</strong> {magnet.subscribers}
                </p>
                <p>
                  <strong>Slug:</strong> {magnet.slug}
                </p>
                {magnet.fileUrl && (
                  <p>
                    <strong>File:</strong> {magnet.fileUrl}
                  </p>
                )}
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(magnet.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "20px",
}
