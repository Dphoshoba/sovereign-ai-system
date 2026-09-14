"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { fromAdelaideWallClock } from "../../../lib/publishing/adelaide-time"
import { AdelaideTimezoneHint } from "@/components/articles/AdelaideTimezoneHint"

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

    const converted = fromAdelaideWallClock(date)
    if (!converted.ok) {
      alert(converted.error)
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
        scheduledFor: converted.iso,
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
          color: "var(--button-foreground)",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Schedule
      </button>

      {showForm && (
        <div style={{ marginTop: "10px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <div>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Scheduled publish time in Australia/Adelaide"
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                }}
              />
              <AdelaideTimezoneHint />
            </div>

            <button
              onClick={scheduleArticle}
              disabled={loading}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "none",
                background: "var(--hero-background)",
                color: "var(--button-foreground)",
                cursor: "pointer",
              }}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
