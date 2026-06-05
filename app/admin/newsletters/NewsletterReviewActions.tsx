"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function NewsletterReviewActions({
  newsletterId,
}: {
  newsletterId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function approveNewsletter() {
    setLoading(true)

    const response = await fetch("/api/newsletters/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newsletterId }),
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || "Approval failed")
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
  }

  async function rejectNewsletter() {
    setLoading(true)

    const response = await fetch("/api/newsletters/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newsletterId }),
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || "Rejection failed")
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={approveNewsletter}
        disabled={loading}
        style={approveStyle}
      >
        Approve
      </button>

      <button
        onClick={rejectNewsletter}
        disabled={loading}
        style={rejectStyle}
      >
        Reject
      </button>
    </>
  )
}

const approveStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#15803d",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
}

const rejectStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#b91c1c",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
}
