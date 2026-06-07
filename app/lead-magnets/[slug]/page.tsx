import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { LeadMagnetSubscribeForm } from "@/components/lead-magnets/LeadMagnetSubscribeForm"

export default async function LeadMagnetPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const leadMagnet = await prisma.leadMagnet.findUnique({
    where: { slug },
  })

  if (!leadMagnet || leadMagnet.status !== "active") {
    notFound()
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Free Guide</p>

        <h1>{leadMagnet.title}</h1>

        <p style={descriptionStyle}>{leadMagnet.description}</p>

        <LeadMagnetSubscribeForm
          leadMagnetId={leadMagnet.id}
          fileUrl={leadMagnet.fileUrl}
        />
      </section>
    </main>
  )
}

const cardStyle: React.CSSProperties = {
  maxWidth: "720px",
  margin: "0 auto",
  border: "1px solid #ddd",
  borderRadius: "16px",
  padding: "32px",
}

const eyebrowStyle: React.CSSProperties = {
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#555",
}

const descriptionStyle: React.CSSProperties = {
  fontSize: "18px",
  lineHeight: 1.6,
}
