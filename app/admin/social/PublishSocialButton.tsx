"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function PublishSocialButton({
  postId,
  platform,
}: {
  postId: string
  platform: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function publishPost() {
    setLoading(true)

    const response = await fetch(`/api/social/publish/${platform}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ postId }),
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || "Publishing failed")
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={publishPost}
      disabled={loading}
      style={{
        padding: "10px 14px",
        borderRadius: "8px",
        border: "none",
        background: "#111",
        color: "#fff",
        fontWeight: "bold",
        cursor: "pointer",
      }}
    >
      {loading ? "Publishing..." : `Publish ${platform}`}
    </button>
  )
}
