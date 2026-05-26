"use client"

import { useState } from "react"

export default function SendNewsletterButton({ draftId }: { draftId: string }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  async function sendNewsletter() {
    if (!confirm("Send this newsletter to all active subscribers?")) return

    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ draftId }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to send newsletter")
      }

      setMessage(`Sent to ${data.sent} subscriber(s).`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={sendNewsletter}
        disabled={loading}
        className="rounded-xl bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Sending..." : "Send Newsletter"}
      </button>

      {message && <p className="text-sm text-zinc-300">{message}</p>}
    </div>
  )
}