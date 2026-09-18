"use client"

import { useEffect, useState } from "react"

export type FeaturedImagePromptRecord = {
  prompt: string
  approvedAt: string
  approvedBy: string
  contentFingerprint: string
  noteId: string | null
}

export type FeaturedImagePromptViewState = {
  ok: true
  articleStatus: string
  featuredImage: string | null
  contentFingerprint: string
  hasCurrentAudit: boolean
  promptStatus: "current" | "historical-stale" | "missing"
  current: FeaturedImagePromptRecord | null
  historicalStale: FeaturedImagePromptRecord[]
  canApprove: boolean
  canGenerate: boolean
  code?: string
  error?: string
}

export function featuredImagePromptStatusLabel(
  status: FeaturedImagePromptViewState["promptStatus"],
) {
  if (status === "current") return "Current"
  if (status === "historical-stale") return "Historical-stale"
  return "Missing"
}

export function FeaturedImagePromptForm({
  state,
  draftPrompt,
  onDraftPromptChange,
  replace,
  onReplaceChange,
  saving,
  generating,
  message,
  generationError,
  onApprove,
  onGenerate,
}: {
  state: FeaturedImagePromptViewState | null
  draftPrompt: string
  onDraftPromptChange: (value: string) => void
  replace: boolean
  onReplaceChange: (value: boolean) => void
  saving: boolean
  generating: boolean
  message: string
  generationError: string
  onApprove: () => void
  onGenerate: () => void
}) {
  const canGenerate = Boolean(state?.canGenerate)
  const stalePrompt = state?.historicalStale[0]

  return (
    <section
      aria-label="Featured image prompt"
      style={{
        display: "grid",
        gap: "12px",
        padding: "16px",
        border: "1px solid var(--border)",
        borderRadius: "12px",
      }}
    >
      <div>
        <strong>Featured-image prompt</strong>
        <p style={{ margin: "6px 0 0", fontSize: "14px" }}>
          Status: {state ? featuredImagePromptStatusLabel(state.promptStatus) : "Unavailable"}
        </p>
      </div>

      <label>
        Prompt for human approval
        <textarea
          rows={8}
          value={draftPrompt}
          onChange={(event) => onDraftPromptChange(event.target.value)}
          placeholder="Review and approve the generation prompt. Old governance notes are not used automatically."
          style={{
            display: "block",
            width: "100%",
            marginTop: "6px",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            fontSize: "16px",
          }}
        />
      </label>

      {stalePrompt ? (
        <details>
          <summary>Historical-stale prompt</summary>
          <p style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>{stalePrompt.prompt}</p>
          <p style={{ fontSize: "12px" }}>
            Fingerprint {stalePrompt.contentFingerprint}. Re-approve explicitly against the
            current article revision. This text is not used for generation.
          </p>
        </details>
      ) : null}

      {state?.current ? (
        <label style={{ fontSize: "14px" }}>
          <input
            type="checkbox"
            checked={replace}
            onChange={(event) => onReplaceChange(event.target.checked)}
          />{" "}
          Replace the current approved prompt
        </label>
      ) : null}

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onApprove}
          disabled={saving || !state?.canApprove}
          style={buttonStyle}
        >
          {saving ? "Saving prompt..." : "Approve featured-image prompt"}
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating || !canGenerate}
          style={buttonStyle}
        >
          {generating ? "Generating Image..." : "Generate Featured Image"}
        </button>
      </div>

      {!canGenerate ? (
        <p style={{ fontSize: "14px", margin: 0 }}>
          Generation stays blocked until a current approved prompt exists for this fingerprint.
        </p>
      ) : null}

      {message ? (
        <p
          style={{
            color: message.toLowerCase().includes("approved") ? "#2e7d32" : "#cc0000",
            fontSize: "14px",
            margin: 0,
          }}
        >
          {message}
        </p>
      ) : null}
      {generationError ? (
        <p style={{ color: "#cc0000", fontSize: "14px", margin: 0 }}>{generationError}</p>
      ) : null}
    </section>
  )
}

export function FeaturedImagePromptPanel({
  articleId,
  featuredImage,
  onArticleUpdate,
  generating,
  generationError,
  onGenerate,
}: {
  articleId: string
  featuredImage: string | null
  onArticleUpdate?: (article: { featuredImage?: string | null }) => void
  generating: boolean
  generationError: string
  onGenerate: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<FeaturedImagePromptViewState | null>(null)
  const [draftPrompt, setDraftPrompt] = useState("")
  const [replace, setReplace] = useState(false)
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadPrompt() {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/articles/featured-image-prompt?articleId=${encodeURIComponent(articleId)}`,
        )
        const result = await response.json()
        if (cancelled) return
        if (!response.ok || !result.ok) {
          setState(null)
          setMessage(result.error || "Failed to load featured-image prompt status.")
          return
        }
        setState(result)
        setDraftPrompt(result.current?.prompt ?? "")
        setReplace(false)
        setMessage(result.error || "")
      } catch (error) {
        if (cancelled) return
        setMessage(error instanceof Error ? error.message : "Failed to load prompt status.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadPrompt()
    return () => {
      cancelled = true
    }
  }, [articleId, featuredImage])

  async function handleApprove() {
    setSaving(true)
    setMessage("")
    try {
      const response = await fetch("/api/articles/featured-image-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          prompt: draftPrompt,
          ...(replace ? { replace: true } : {}),
        }),
      })
      const result = await response.json()
      if (!response.ok || !result.ok) {
        setMessage(result.error || "Prompt approval failed.")
        return
      }
      setMessage(
        result.alreadyApplied
          ? "Prompt already approved for this fingerprint."
          : "Featured-image prompt approved.",
      )
      const reload = await fetch(
        `/api/articles/featured-image-prompt?articleId=${encodeURIComponent(articleId)}`,
      )
      const next = await reload.json()
      if (reload.ok && next.ok) {
        setState(next)
        setDraftPrompt(next.current?.prompt ?? draftPrompt)
        setReplace(false)
      }
      onArticleUpdate?.({})
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Prompt approval failed.")
    } finally {
      setSaving(false)
    }
  }

  if (loading && !state) {
    return <p>Loading featured-image prompt status...</p>
  }

  return (
    <FeaturedImagePromptForm
      state={state}
      draftPrompt={draftPrompt}
      onDraftPromptChange={setDraftPrompt}
      replace={replace}
      onReplaceChange={setReplace}
      saving={saving}
      generating={generating}
      message={message}
      generationError={generationError}
      onApprove={handleApprove}
      onGenerate={onGenerate}
    />
  )
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "1px solid var(--border)",
  background: "var(--background)",
  color: "var(--foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}
