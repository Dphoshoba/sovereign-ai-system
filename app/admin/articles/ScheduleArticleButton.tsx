"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function ScheduleArticleButton({
  articleId,
}: {
  articleId: string
}) {
  const router = useRouter()

  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState("")
  const [loading, setLoading] = useState(false)

  async function scheduleArticle() {
    if (!date) {
      alert("Please choose a date and time.")
      return
    }

    setLoading(true)

    const response = await fetch("/api/articles/schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        articleId,
        scheduledFor: date,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || "Scheduling failed")
      setLoading(false)
      return
    }

    setLoading(false)
    setShowForm(false)
    router.refresh()
  }

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
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

      {showForm && (
        <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />

          <button
            onClick={scheduleArticle}
            disabled={loading}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "none",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      )}
    </div>
  )
}
