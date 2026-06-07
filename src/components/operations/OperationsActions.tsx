"use client"

import { useState } from "react"

export default function OperationsActions() {
  const [loading, setLoading] = useState(false)

  async function runAction(action: string) {
    setLoading(true)

    const response = await fetch("/api/operations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action }),
    })

    const result = await response.json()

    setLoading(false)

    if (!response.ok) {
      alert(result.error || "Operation failed")
      return
    }

    alert(result.message || "Operation completed")
  }

  return (
    <div style={{ marginTop: 30 }}>
      <h2>Operations Actions</h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <button onClick={() => runAction("weekly-planner")}>
          Run Weekly Planner
        </button>

        <button onClick={() => runAction("publish-scheduled")}>
          Publish Scheduled
        </button>

        <button onClick={() => runAction("snapshot")}>
          Create Snapshot
        </button>

        <button onClick={() => runAction("intelligence")}>
          Run Intelligence
        </button>

        <button onClick={() => runAction("pipeline")}>
          Run Entire Pipeline
        </button>
      </div>

      {loading && <p>Running operation...</p>}
    </div>
  )
}
