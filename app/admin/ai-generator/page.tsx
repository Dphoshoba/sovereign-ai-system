"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  canRetryDirectorPrepare,
  describeDirectorPrepareOutcome,
  directorPrepareReviewPath,
  type DirectorPrepareOutcome,
} from "../../../lib/publishing/director-prepare-presentation"

type StageRecord = {
  id?: string
  status?: string
  detail?: string
  attempts?: number
}

type DirectorPrepareResult = {
  ok?: boolean
  outcome?: DirectorPrepareOutcome | string
  articleId?: string | null
  status?: string | null
  holdReason?: string | null
  error?: string
  code?: string
  stages?: StageRecord[]
  alreadyApplied?: boolean
  sideEffects?: {
    approved?: boolean
    scheduled?: boolean
    published?: boolean
    socialDistributed?: boolean
    featuredImageGenerated?: boolean
  }
  generation?: {
    articleId?: string
    title?: string
    statusBeforeRunner?: string
  }
}

type ProgressPhase =
  | "idle"
  | "generating_draft"
  | "running_stages"
  | "done"
  | "error"

export default function AiGeneratorPage() {
  const router = useRouter()

  const [topic, setTopic] = useState("")
  const [category, setCategory] = useState("ai-automation")
  const [articleId, setArticleId] = useState("")
  const [phase, setPhase] = useState<ProgressPhase>("idle")
  const [result, setResult] = useState<DirectorPrepareResult | null>(null)

  const busy = phase === "generating_draft" || phase === "running_stages"

  async function runStageRunner(id: string): Promise<DirectorPrepareResult> {
    setPhase("running_stages")
    const response = await fetch("/api/articles/editorial-stage-runner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId: id }),
    })
    return (await response.json()) as DirectorPrepareResult
  }

  async function prepareForDirectorReview(event: React.FormEvent) {
    event.preventDefault()
    setResult(null)

    const existingId = articleId.trim()

    try {
      let next: DirectorPrepareResult

      if (existingId) {
        next = await runStageRunner(existingId)
      } else {
        setPhase("generating_draft")
        const response = await fetch("/api/ai/generate-article", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            category,
            directorPrepare: true,
          }),
        })
        next = (await response.json()) as DirectorPrepareResult
      }

      setResult(next)
      setPhase(next.ok === false && next.outcome !== "hold" ? "error" : "done")

      const id = next.articleId || next.generation?.articleId || existingId
      if (
        id &&
        (next.outcome === "ready_for_human_review" ||
          next.outcome === "already_applied")
      ) {
        router.push(directorPrepareReviewPath(id))
        router.refresh()
      }
    } catch (error) {
      setPhase("error")
      setResult({
        ok: false,
        outcome: "failed",
        error:
          error instanceof Error
            ? error.message
            : "Prepare for Director review failed.",
      })
    }
  }

  async function retryPrepare() {
    const id =
      result?.articleId || result?.generation?.articleId || articleId.trim()
    if (!id || !canRetryDirectorPrepare(result || {})) return

    try {
      const next = await runStageRunner(id)
      setResult(next)
      setPhase(next.ok === false && next.outcome !== "hold" ? "error" : "done")

      if (
        next.articleId &&
        (next.outcome === "ready_for_human_review" ||
          next.outcome === "already_applied")
      ) {
        router.push(directorPrepareReviewPath(next.articleId))
        router.refresh()
      }
    } catch (error) {
      setPhase("error")
      setResult({
        ok: false,
        outcome: "failed",
        articleId: id,
        error:
          error instanceof Error ? error.message : "Retry failed.",
      })
    }
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>Director article preparation</h1>

      <p style={{ maxWidth: 760, color: "var(--muted)", lineHeight: 1.7 }}>
        Suggest a topic or reuse an existing draft. The platform creates or
        reuses the draft, runs the editorial stage runner (research, evidence,
        audit), and stops for human review. This action never approves,
        schedules, publishes, generates a featured image, or distributes to
        social.
      </p>

      <form onSubmit={prepareForDirectorReview} style={formStyle}>
        <label>
          Article topic
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required={!articleId.trim()}
            disabled={Boolean(articleId.trim()) || busy}
            placeholder="Example: How AI agents help small businesses save time"
            style={inputStyle}
          />
        </label>

        <label>
          Category
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required={!articleId.trim()}
            disabled={Boolean(articleId.trim()) || busy}
            style={inputStyle}
          />
        </label>

        <label>
          Existing draft article ID (optional)
          <input
            value={articleId}
            onChange={(e) => setArticleId(e.target.value)}
            disabled={busy}
            placeholder="Leave blank to generate from topic"
            style={inputStyle}
          />
        </label>

        <button disabled={busy} style={buttonStyle} type="submit">
          {busy
            ? phase === "generating_draft"
              ? "Creating draft…"
              : "Running editorial stages…"
            : "Prepare for Director Review"}
        </button>
      </form>

      {phase !== "idle" && (
        <section style={resultStyle} aria-live="polite">
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Preparation status</h2>
          <p style={{ marginBottom: 8 }}>
            {phase === "generating_draft" && "Creating draft and collecting sources…"}
            {phase === "running_stages" &&
              "Running research, evidence, and audit stages…"}
            {(phase === "done" || phase === "error") &&
              describeDirectorPrepareOutcome(result?.outcome)}
          </p>

          {result?.outcome && (
            <p>
              <strong>Outcome:</strong> {result.outcome}
              {result.status ? ` · status ${result.status}` : ""}
            </p>
          )}

          {result?.holdReason && (
            <p style={{ color: "#9f1239" }}>
              <strong>HOLD:</strong> {result.holdReason}
            </p>
          )}

          {result?.error && (
            <p style={{ color: "#9f1239" }}>
              <strong>Error:</strong> {result.error}
              {result.code ? ` (${result.code})` : ""}
            </p>
          )}

          {Array.isArray(result?.stages) && result.stages.length > 0 && (
            <ul style={{ paddingLeft: 18, lineHeight: 1.6 }}>
              {result.stages.map((stage, index) => (
                <li key={`${stage.id || "stage"}-${index}`}>
                  {stage.id || "stage"}: {stage.status}
                  {stage.detail ? ` — ${stage.detail}` : ""}
                  {stage.attempts ? ` (attempts ${stage.attempts})` : ""}
                </li>
              ))}
            </ul>
          )}

          {result?.sideEffects && (
            <p style={{ fontSize: 14, color: "var(--muted)" }}>
              Side effects: approve={String(!!result.sideEffects.approved)},
              schedule={String(!!result.sideEffects.scheduled)}, publish=
              {String(!!result.sideEffects.published)}, social=
              {String(!!result.sideEffects.socialDistributed)}, image=
              {String(!!result.sideEffects.featuredImageGenerated)}
            </p>
          )}

          {canRetryDirectorPrepare(result || {}) && (
            <button
              type="button"
              onClick={retryPrepare}
              disabled={busy}
              style={{ ...buttonStyle, background: "#0f766e", marginTop: 8 }}
            >
              Retry preparation
            </button>
          )}

          {(result?.outcome === "ready_for_human_review" ||
            result?.outcome === "already_applied") &&
            (result.articleId || result.generation?.articleId) && (
              <p style={{ marginTop: 12 }}>
                <a
                  href={directorPrepareReviewPath(
                    result.articleId ||
                      result.generation?.articleId ||
                      "",
                  )}
                >
                  Open article review
                </a>
              </p>
            )}
        </section>
      )}
    </main>
  )
}

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
  maxWidth: 760,
  marginTop: 24,
  background: "var(--card-background)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 24,
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: 12,
  borderRadius: 10,
  border: "1px solid var(--border)",
  fontSize: 16,
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "var(--hero-background)",
  color: "var(--button-foreground)",
  cursor: "pointer",
  fontWeight: "bold",
}

const resultStyle: React.CSSProperties = {
  maxWidth: 760,
  marginTop: 24,
  padding: 20,
  borderRadius: 14,
  border: "1px solid var(--border)",
  background: "var(--card-background)",
  lineHeight: 1.6,
}
