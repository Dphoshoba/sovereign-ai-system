"use client"

import { useState } from "react"
import type { CorrectableAuditedChanges } from "../../../lib/publishing/correct-and-withdraw"

export type WithdrawForCorrectionFormProps = {
  open: boolean
  reason: string
  error: string
  submitting: boolean
  onOpen: () => void
  onCancel: () => void
  onReasonChange: (value: string) => void
  onConfirm: () => void
}

export function canShowWithdrawForCorrection(status: string): boolean {
  return status === "published"
}

export function WithdrawForCorrectionForm({
  open,
  reason,
  error,
  submitting,
  onOpen,
  onCancel,
  onReasonChange,
  onConfirm,
}: WithdrawForCorrectionFormProps) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        disabled={submitting}
        style={openButton}
      >
        Withdraw for Correction
      </button>
    )
  }

  const confirmDisabled = submitting || reason.trim() === ""

  return (
    <section
      style={panelStyle}
      aria-label="Withdraw for Correction confirmation"
    >
      <h2 style={{ margin: 0, fontSize: "18px" }}>Withdraw for Correction</h2>
      <p>
        This article will immediately leave the public site. Readers will no
        longer see it at the published blog URL.
      </p>
      <p>
        A new Prepare for Review, approval, and publication will be required
        before it can appear publicly again.
      </p>
      <label>
        Correction reason
        <textarea
          rows={4}
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="Explain the factual correction being applied."
          style={textareaStyle}
          aria-label="Correction reason"
        />
      </label>
      {error ? (
        <p role="alert" style={{ color: "#b91c1c", marginBottom: 0 }}>
          {error}
        </p>
      ) : null}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirmDisabled}
          style={confirmButton}
        >
          {submitting ? "Withdrawing..." : "Confirm withdrawal"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          style={cancelButton}
        >
          Cancel
        </button>
      </div>
    </section>
  )
}

export function WithdrawForCorrectionPanel({
  articleId,
  status,
  changes,
  onCorrected,
}: {
  articleId: string
  status: string
  changes: CorrectableAuditedChanges
  onCorrected: (article: { status: string }) => void
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (!canShowWithdrawForCorrection(status)) return null

  async function confirmWithdrawal() {
    const trimmedReason = reason.trim()
    if (!trimmedReason) {
      setError("A correction reason is required.")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/articles/correct-and-unpublish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          reason: trimmedReason,
          changes,
        }),
      })
      const result = await response.json()
      if (!response.ok || !result.ok) {
        setError(result.error || "Article correction failed.")
        return
      }
      setOpen(false)
      setReason("")
      onCorrected(result.article)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Article correction failed.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <WithdrawForCorrectionForm
      open={open}
      reason={reason}
      error={error}
      submitting={submitting}
      onOpen={() => {
        setError("")
        setOpen(true)
      }}
      onCancel={() => {
        if (submitting) return
        setOpen(false)
        setError("")
      }}
      onReasonChange={setReason}
      onConfirm={confirmWithdrawal}
    />
  )
}

const openButton: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#92400e",
  color: "var(--hero-foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const panelStyle: React.CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #92400e",
  background: "#fff7ed",
}

const textareaStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: "6px",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid var(--border)",
  fontSize: "16px",
}

const confirmButton: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#92400e",
  color: "var(--hero-foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const cancelButton: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "1px solid var(--border)",
  background: "transparent",
  cursor: "pointer",
}
