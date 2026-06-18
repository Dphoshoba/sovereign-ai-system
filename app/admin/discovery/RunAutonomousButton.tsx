"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function RunAutonomousButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function runCycle() {
    setLoading(true)

    await fetch("/api/discovery/run-autonomous", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        saveLimit: 10,
        generateLimit: 1,
      }),
    })

    setLoading(false)
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={runCycle}
      disabled={loading}
      style={{
        padding: "10px 14px",
        borderRadius: "8px",
        background: "#111",
        color: "#fff",
        fontWeight: "bold",
        border: "none",
        cursor: loading ? "wait" : "pointer",
      }}
    >
      {loading ? "Running..." : "Run Discovery Cycle"}
    </button>
  )
}