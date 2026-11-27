"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  canRetryDirectorPrepare,
  describeDirectorPrepareOutcome,
  directorPrepareReviewPath,
} from "../../../lib/publishing/director-prepare-presentation"

export function PrepareForReviewButton({
  articleId,
  onPrepared,
}: {
  articleId: string
  onPrepared?: (result: {
    article?: { status?: unknown } | null
    audit?: { specificationVersion?: string | null } | null
    outcome?: string
  }) => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [holdReason, setHoldReason] = useState<string | null>(null)
  const [canRetry, setCanRetry] = useState(false)

  async function runPrepare() {
    setLoading(true)
    setMessage(null)
    setHoldReason(null)

    try {
      const response = await fetch("/api/articles/editorial-stage-runner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ articleId }),
      })

      const result = await response.json()

      setCanRetry(canRetryDirectorPrepare(result))
      setHoldReason(
        typeof result.holdReason === "string" ? result.holdReason : null,
      )
      setMessage(
        result.error ||
          describeDirectorPrepareOutcome(result.outcome) ||
          "Prepare finished.",
      )

      if (
        result.ok &&
        (result.outcome === "ready_for_human_review" ||
          result.outcome === "already_applied")
      ) {
        onPrepared?.({
          article: { status: result.status },
          audit: result.audit ?? null,
          outcome: result.outcome,
        })
        router.push(directorPrepareReviewPath(articleId))
        router.refresh()
        return
      }

      if (result.ok === false && !canRetryDirectorPrepare(result)) {
        return
      }

      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button onClick={runPrepare} disabled={loading} style={buttonStyle}>
        {loading ? "Preparing…" : "Prepare for Director Review"}
      </button>
      {message && (
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{message}</p>
      )}
      {holdReason && (
        <p style={{ margin: 0, fontSize: 13, color: "#9f1239" }}>
          HOLD: {holdReason}
        </p>
      )}
      {canRetry && (
        <button onClick={runPrepare} disabled={loading} style={retryStyle}>
          Retry preparation
        </button>
      )}
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#0f766e",
  color: "var(--button-foreground)",
  fontWeight: "bold",
  cursor: "pointer",
}

const retryStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#b45309",
}
