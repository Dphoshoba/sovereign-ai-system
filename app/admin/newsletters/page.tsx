import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { NewsletterActions } from "@/components/newsletter/NewsletterActions"

const STATUS_FILTERS = [
  { key: "all", label: "All", status: null },
  { key: "review-required", label: "Review Required", status: "review-required" },
  { key: "approved", label: "Approved", status: "approved" },
  { key: "sent", label: "Sent", status: "sent" },
] as const

export default async function AdminNewslettersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: statusParam } = await searchParams

  const activeFilter =
    STATUS_FILTERS.find((f) => f.key === statusParam) ?? STATUS_FILTERS[0]

  const newsletters = await prisma.newsletter.findMany({
    where: activeFilter.status ? { status: activeFilter.status } : undefined,
    orderBy: { createdAt: "desc" },
  })

  const allNewsletters = await prisma.newsletter.findMany()

  const total = allNewsletters.length
  const reviewRequired = allNewsletters.filter(
    (newsletter) => newsletter.status === "review-required"
  ).length
  const approved = allNewsletters.filter(
    (newsletter) => newsletter.status === "approved"
  ).length
  const sent = allNewsletters.filter(
    (newsletter) => newsletter.status === "sent"
  ).length

  const recentSent = allNewsletters
    .filter((newsletter) => newsletter.status === "sent" && newsletter.sentAt)
    .sort(
      (a, b) =>
        new Date(b.sentAt as Date).getTime() -
        new Date(a.sentAt as Date).getTime()
    )
    .slice(0, 5)

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Newsletter Queue</h1>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "20px" }}>
        <div style={statCardStyle}>
          <strong>Total</strong>
          <span>{total}</span>
        </div>

        <div style={statCardStyle}>
          <strong>Review Required</strong>
          <span>{reviewRequired}</span>
        </div>

        <div style={statCardStyle}>
          <strong>Approved</strong>
          <span>{approved}</span>
        </div>

        <div style={statCardStyle}>
          <strong>Sent</strong>
          <span>{sent}</span>
        </div>
      </div>

      <section style={{ marginTop: "24px" }}>
        <h2>Recent Sends</h2>

        {recentSent.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No newsletters sent yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {recentSent.map((newsletter) => (
              <div key={newsletter.id} style={miniCardStyle}>
                <strong>{newsletter.subject}</strong>
                <span>
                  Sent:{" "}
                  {newsletter.sentAt
                    ? new Date(newsletter.sentAt).toLocaleString()
                    : "Unknown"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <p style={{ marginTop: "24px" }}>
        {activeFilter.label}: {newsletters.length}
      </p>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "20px" }}>
        {STATUS_FILTERS.map((filter) => {
          const isActive = filter.key === activeFilter.key
          const href =
            filter.status === null
              ? "/admin/newsletters"
              : `/admin/newsletters?status=${filter.key}`

          const count =
            filter.status === null
              ? total
              : allNewsletters.filter(
                  (newsletter) => newsletter.status === filter.status
                ).length

          return (
            <Link
              key={filter.key}
              href={href}
              style={{
                ...tabStyle,
                background: isActive ? "#111" : "#f2f2f2",
                color: isActive ? "#fff" : "#111",
              }}
            >
              {filter.label}
              <span
                style={{
                  ...badgeStyle,
                  background: isActive ? "#fff" : "#111",
                  color: isActive ? "#111" : "#fff",
                }}
              >
                {count}
              </span>
            </Link>
          )
        })}
      </div>

      <div style={{ display: "grid", gap: "16px", marginTop: "24px" }}>
        {newsletters.map((newsletter) => (
          <div key={newsletter.id} style={cardStyle}>
            <h2>{newsletter.subject}</h2>

            <p>
              <strong>ID:</strong> {newsletter.id}
            </p>

            <p>
              <strong>Status:</strong> {newsletter.status}
            </p>

            <NewsletterActions
              newsletterId={newsletter.id}
              status={newsletter.status}
            />

            {newsletter.previewText && (
              <p>
                <strong>Preview:</strong> {newsletter.previewText}
              </p>
            )}

            <div style={{ whiteSpace: "pre-wrap", marginTop: "12px" }}>
              {newsletter.content}
            </div>

            {newsletter.sentAt && (
              <p>
                <strong>Sent:</strong>{" "}
                {new Date(newsletter.sentAt).toLocaleString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}

const statCardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "16px",
  minWidth: "170px",
  display: "grid",
  gap: "8px",
}

const miniCardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "12px",
  display: "grid",
  gap: "6px",
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "20px",
}

const tabStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 14px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: "bold",
  border: "1px solid var(--border)",
}

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "20px",
  height: "20px",
  padding: "0 6px",
  borderRadius: "999px",
  fontSize: "12px",
}