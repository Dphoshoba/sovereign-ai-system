"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function GenerateTopicButton({ topicId }: { topicId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function generateArticle() {
    setLoading(true)

    await fetch("/api/discovery/generate-from-queue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topicId }),
    })

    setLoading(false)
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={generateArticle}
      disabled={loading}
      style={{
        padding: "10px 14px",
        borderRadius: "8px",
        background: "var(--hero-background)",
        color: "var(--button-foreground)",
        fontWeight: "bold",
        border: "none",
        cursor: loading ? "wait" : "pointer",
      }}
    >
      {loading ? "Generating..." : "Generate Article"}
    </button>
  )
}