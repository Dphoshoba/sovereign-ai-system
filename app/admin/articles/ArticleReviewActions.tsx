"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function ArticleReviewActions({ articleId }: { articleId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function approveArticle() {
    setLoading(true)

    try {
      const response = await fetch("/api/articles/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId,
          approvedBy: "David",
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || "Approval failed")
        return
      }

      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function rejectArticle() {
    const rejectionReason =
      window.prompt("Reason for rejection?") ||
      "Rejected during editorial review"

    setLoading(true)

    try {
      const response = await fetch("/api/articles/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId,
          rejectedBy: "David",
          rejectionReason,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || "Rejection failed")
        return
      }

      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", gap: "10px" }}>
      <button onClick={approveArticle} disabled={loading} style={approveStyle}>
        {loading ? "Working..." : "Approve"}
      </button>

      <button onClick={rejectArticle} disabled={loading} style={rejectStyle}>
        {loading ? "Working..." : "Reject"}
      </button>
    </div>
  )
}

const approveStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#15803d",
  color: "var(--button-foreground)",
  fontWeight: "bold",
  cursor: "pointer",
}

const rejectStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#b91c1c",
  color: "var(--button-foreground)",
  fontWeight: "bold",
  cursor: "pointer",
}