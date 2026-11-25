"use client"

/**
 * Confirms a primary-source supported claim on the current EV-REG-SPEC-1.1.0 audit.
 * Caller: app/admin/articles/ArticleAuditPanel.tsx ClaimDecisionList.
 * No existing button performs primary-source confirmation.
 * Writes via POST /api/articles/confirm-primary-source (audit facts confirmation
 * metadata + recommendation only; scores unchanged).
 * User instruction: authorised human editor confirms exact claim and evidence
 * on the current audit; scores retained without alteration.
 */
import { useRouter } from "next/navigation"
import { useState } from "react"

export function ConfirmPrimarySourceButton({
  articleId,
  auditId,
  claim,
}: {
  articleId: string
  auditId: string
  claim: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function confirm() {
    setLoading(true)
    try {
      const response = await fetch("/api/articles/confirm-primary-source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          auditId,
          claim,
          decision: "confirmed",
          rationale:
            "Editor confirmed full-claim support against the authoritative primary document.",
        }),
      })
      const result = await response.json()
      if (!response.ok || result.ok === false) {
        alert(result.error || "Primary-source confirmation failed")
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={confirm}
      disabled={loading}
      style={{
        marginTop: "6px",
        padding: "6px 10px",
        cursor: loading ? "wait" : "pointer",
      }}
    >
      {loading ? "Confirming…" : "Confirm primary-source evidence"}
    </button>
  )
}
