import Link from "next/link"
import { prisma } from "@/lib/prisma"

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

  const counts = await prisma.newsletter.groupBy({
    by: ["status"],
    _count: { _all: true },
  })

  const countByStatus = new Map<string, number>()
  let total = 0

  for (const row of counts) {
    countByStatus.set(row.status, row._count._all)
    total += row._count._all
  }

  const countForFilter = (status: string | null) =>
    status === null ? total : countByStatus.get(status) ?? 0

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Newsletter Queue</h1>
      <p>
        {activeFilter.label}: {newsletters.length}
      </p>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "20px" }}>
        {STATUS_FILTERS.map((filter) => {
          const isActive = filter.key === activeFilter.key
          const href =
            filter.status === null
              ? "/admin/newsletters"
              : `/admin/newsletters?status=${filter.key}`

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
                {countForFilter(filter.status)}
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

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
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
  border: "1px solid #ddd",
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
