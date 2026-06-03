"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function ScheduleArticleButton({
  articleId,
}: {
  articleId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function scheduleArticle() {
    const date = prompt(
      "Enter schedule date (YYYY-MM-DD HH:mm)"
    )

    if (!date) return

    setLoading(true)

    await fetch("/api/articles/schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        articleId,
        scheduledFor: date,
      }),
    })

    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={scheduleArticle}
      disabled={loading}
      style={{
        padding: "10px 14px",
        borderRadius: "8px",
        border: "none",
        background: "#2563eb",
        color: "#fff",
        fontWeight: "bold",
        cursor: "pointer",
      }}
    >
      Schedule
    </button>
  )
}
