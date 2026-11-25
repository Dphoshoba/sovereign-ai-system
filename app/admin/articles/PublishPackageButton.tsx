"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import {
  IMMEDIATE_PUBLISH_CONFIRM,
  submitImmediatePublishPackage,
} from "../../../lib/publishing/immediate-publish-action"

export type PublishPackageFormProps = {
  submitting: boolean
  error: string
  onPublish: () => void
}

export function PublishPackageForm({
  submitting,
  error,
  onPublish,
}: PublishPackageFormProps) {
  return (
    <div>
      <p style={{ fontSize: "14px", margin: "0 0 8px" }}>
        Publication is immediate. The article will appear on the public site.
      </p>
      <button
        type="button"
        onClick={onPublish}
        disabled={submitting}
        style={publishStyle}
      >
        {submitting ? "Publishing..." : "Publish Package"}
      </button>
      {error ? (
        <p role="alert" style={{ color: "#b91c1c", margin: "8px 0 0" }}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function PublishPackageButton({ articleId }: { articleId: string }) {
  const router = useRouter()
  const inFlight = useRef(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handlePublish() {
    if (inFlight.current || submitting) return
    if (!confirm(IMMEDIATE_PUBLISH_CONFIRM)) return

    setError("")
    setSubmitting(true)

    const result = await submitImmediatePublishPackage({
      articleId,
      inFlight,
    })

    if (!result.ok) {
      if (!result.skipped && result.error) setError(result.error)
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    router.refresh()
  }

  return (
    <PublishPackageForm
      submitting={submitting}
      error={error}
      onPublish={handlePublish}
    />
  )
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
