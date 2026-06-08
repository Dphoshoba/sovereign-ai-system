"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function ArticleActions({
  articleId,
  status,
}: {
  articleId: string
  status: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function runAction(endpoint: string, confirmMessage?: string) {
    if (confirmMessage && !confirm(confirmMessage)) return

    setLoading(true)

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ articleId }),
    })

    const result = await response.json()

    setLoading(false)

    if (!response.ok) {
      alert(result.error || "Action failed")
      return
    }

    router.refresh()
  }

  async function generateArticle() {
    if (!confirm("Generate full article content for this draft?")) return

    setLoading(true)

    const response = await fetch("/api/articles/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ articleId }),
    })

    const result = await response.json()

    setLoading(false)

    if (!response.ok) {
      alert(result.error || "Generation failed")
      return
    }

    alert("Article generated successfully.")
    router.refresh()
  }

  return (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
      {status === "draft" && (
        <button disabled={loading} onClick={generateArticle} style={generateStyle}>
          Generate Article
        </button>
      )}

      {status === "review-required" && (
        <button
          disabled={loading}
          onClick={() =>
            runAction(
              "/api/articles/publish-package",
              "Publish article and approve related newsletter/social posts?"
            )
          }
          style={publishStyle}
        >
          Publish Package
        </button>
      )}

      {status === "review-required" && (
        <button
          disabled={loading}
          onClick={async () => {
            const value = prompt(
              "Enter schedule date/time, example: 2026-06-10T09:00:00"
            )

            if (!value) return

            setLoading(true)

            const response = await fetch("/api/articles/schedule-package", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                articleId,
                scheduledFor: value,
              }),
            })

            const result = await response.json()
            setLoading(false)

            if (!response.ok) {
              alert(result.error || "Schedule failed")
              return
            }

            alert("Package scheduled successfully.")
            router.refresh()
          }}
          style={scheduleStyle}
        >
          Schedule Package
        </button>
      )}

      {status !== "archived" && (
        <button
          disabled={loading}
          onClick={() =>
            runAction("/api/articles/archive", "Archive this article?")
          }
          style={archiveStyle}
        >
          Archive
        </button>
      )}

      <button
        disabled={loading}
        onClick={() =>
          runAction("/api/articles/delete", "Delete this article permanently?")
        }
        style={deleteStyle}
      >
        Delete
      </button>
    </div>
  )
}

const generateStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#15803d",
  color: "var(--button-foreground)",
  fontWeight: "bold",
  cursor: "pointer",
}

const publishStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#1d4ed8",
  color: "var(--button-foreground)",
  fontWeight: "bold",
  cursor: "pointer",
}

const scheduleStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#7c3aed",
  color: "var(--button-foreground)",
  fontWeight: "bold",
  cursor: "pointer",
}

const archiveStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#92400e",
  color: "var(--button-foreground)",
  fontWeight: "bold",
  cursor: "pointer",
}

const deleteStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#b91c1c",
  color: "var(--button-foreground)",
  fontWeight: "bold",
  cursor: "pointer",
}
