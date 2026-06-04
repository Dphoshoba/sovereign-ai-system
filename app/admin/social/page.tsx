import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PublishSocialButton } from "./PublishSocialButton"
import { SocialReviewActions } from "./SocialReviewActions"

const STATUS_FILTERS = [
  { key: "all", label: "All", status: null },
  { key: "review-required", label: "Review Required", status: "review-required" },
  { key: "approved", label: "Approved", status: "approved" },
  { key: "published", label: "Published", status: "published" },
  { key: "rejected", label: "Rejected", status: "rejected" },
] as const

export default async function AdminSocialPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: statusParam } = await searchParams

  const activeFilter =
    STATUS_FILTERS.find((f) => f.key === statusParam) ?? STATUS_FILTERS[0]

  const posts = await prisma.socialPost.findMany({
    where: activeFilter.status ? { status: activeFilter.status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      article: true,
    },
  })

  const counts = await prisma.socialPost.groupBy({
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
      <h1>Social Distribution Queue</h1>
      <p>
        {activeFilter.label}: {posts.length}
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginTop: "20px",
        }}
      >
        {STATUS_FILTERS.map((filter) => {
          const isActive = filter.key === activeFilter.key
          const href =
            filter.status === null
              ? "/admin/social"
              : `/admin/social?status=${filter.key}`

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
        {posts.length === 0 ? (
          <p style={{ color: "#777" }}>
            No social posts with status &ldquo;{activeFilter.label}&rdquo;.
          </p>
        ) : (
          posts.map((post) => (
            <div key={post.id} style={cardStyle}>
              <h2>{post.platform.toUpperCase()}</h2>

              <p>
                <strong>Status:</strong> {post.status}
              </p>

              <p>
                <strong>Article:</strong>{" "}
                {post.article?.title || "No linked article"}
              </p>

              <p style={{ whiteSpace: "pre-wrap" }}>{post.content}</p>

              {post.externalId && (
                <p>
                  <strong>External ID:</strong> {post.externalId}
                </p>
              )}

              {post.publishedAt && (
                <p>
                  <strong>Published:</strong>{" "}
                  {new Date(post.publishedAt).toLocaleString()}
                </p>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                {post.status === "review-required" && (
                  <SocialReviewActions postId={post.id} />
                )}

                {post.status === "approved" && (
                  <PublishSocialButton
                    postId={post.id}
                    platform={post.platform}
                  />
                )}
              </div>
            </div>
          ))
        )}
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
