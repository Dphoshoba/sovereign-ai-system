"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function NewsletterActions({
  newsletterId,
  status,
}: {
  newsletterId: string
  status: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function runAction(endpoint: string) {
    setLoading(true)

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newsletterId }),
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || "Action failed")
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
  }

  async function deleteNewsletter() {
    const confirmed = confirm("Delete this newsletter?")

    if (!confirmed) return

    await runAction("/api/newsletter/delete")
  }

  return (
    <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
      {status === "review-required" && (
        <button
          disabled={loading}
          onClick={() => runAction("/api/newsletter/approve")}
          style={buttonStyle}
        >
          Approve
        </button>
      )}

      {status === "approved" && (
        <button
          disabled={loading}
          onClick={() => runAction("/api/newsletter/send")}
          style={buttonStyle}
        >
          Send
        </button>
      )}

      {status !== "sent" && (
        <button
          disabled={loading}
          onClick={deleteNewsletter}
          style={deleteStyle}
        >
          Delete
        </button>
      )}
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  fontWeight: "bold",
  cursor: "pointer",
}

const deleteStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#b91c1c",
}