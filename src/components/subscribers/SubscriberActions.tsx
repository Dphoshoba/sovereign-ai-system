"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function SubscriberActions({
  subscriberId,
  status,
}: {
  subscriberId: string
  status: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateSubscriber(endpoint: string) {
    setLoading(true)

    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscriberId,
      }),
    })

    router.refresh()
    setLoading(false)
  }

  return (
    <div style={{ marginTop: "10px" }}>
      {status === "active" ? (
        <button
          disabled={loading}
          onClick={() =>
            updateSubscriber("/api/subscribers/unsubscribe")
          }
        >
          Unsubscribe
        </button>
      ) : (
        <button
          disabled={loading}
          onClick={() =>
            updateSubscriber("/api/subscribers/reactivate")
          }
        >
          Reactivate
        </button>
      )}
    </div>
  )
}