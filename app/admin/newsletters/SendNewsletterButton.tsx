"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

/** Retained for compatibility; always uses the singular governed send path. */
export function SendNewsletterButton({
  newsletterId,
}: {
  newsletterId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function sendNewsletter() {
    if (
      !confirm(
        "Send this newsletter to all active subscribers via the governed singular path?",
      )
    ) {
      return
    }

    setLoading(true)

    const response = await fetch("/api/newsletter/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ newsletterId }),
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || "Send failed")
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={sendNewsletter}
      disabled={loading}
      style={{
        padding: "10px 14px",
        borderRadius: "8px",
        border: "none",
        background: "#2563eb",
        color: "var(--button-foreground)",
        fontWeight: "bold",
        cursor: "pointer",
      }}
    >
      {loading ? "Sending..." : "Send Newsletter"}
    </button>
  )
}
