"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function PrepareForReviewButton({ articleId }: { articleId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function prepareForReview() {
    setLoading(true)

    try {
      const response = await fetch("/api/articles/prepare-for-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ articleId }),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || "Prepare for review failed")
        return
      }

      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={prepareForReview} disabled={loading} style={buttonStyle}>
      {loading ? "Preparing..." : "Prepare for Review"}
    </button>
  )
}

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#0f766e",
  color: "var(--button-foreground)",
  fontWeight: "bold",
  cursor: "pointer",
}
