import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import {
  FeaturedImagePromptForm,
  featuredImagePromptStatusLabel,
} from "../../app/admin/articles/FeaturedImagePromptPanel"
import { ARTICLE_2_FEATURED_IMAGE_PROMPT } from "./fixtures/article-2-featured-image-prompt"

const currentState = {
  ok: true as const,
  articleStatus: "approved",
  featuredImage: null,
  contentFingerprint: "a".repeat(64),
  hasCurrentAudit: true,
  promptStatus: "current" as const,
  current: {
    prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT,
    approvedAt: "2026-09-18T12:00:00.000Z",
    approvedBy: "dphogeorge@gmail.com",
    contentFingerprint: "a".repeat(64),
    noteId: "prompt-1",
  },
  historicalStale: [],
  canApprove: true,
  canGenerate: true,
}

describe("FeaturedImagePromptForm", () => {
  it("labels current and historical-stale prompt states", () => {
    expect(featuredImagePromptStatusLabel("current")).toBe("Current")
    expect(featuredImagePromptStatusLabel("historical-stale")).toBe("Historical-stale")
    expect(featuredImagePromptStatusLabel("missing")).toBe("Missing")
  })

  it("enables generation only when a current approved prompt exists", () => {
    const currentHtml = renderToStaticMarkup(
      createElement(FeaturedImagePromptForm, {
        state: currentState,
        draftPrompt: ARTICLE_2_FEATURED_IMAGE_PROMPT,
        onDraftPromptChange: vi.fn(),
        replace: false,
        onReplaceChange: vi.fn(),
        saving: false,
        generating: false,
        message: "",
        generationError: "",
        onApprove: vi.fn(),
        onGenerate: vi.fn(),
      }),
    )
    expect(currentHtml).toContain("Status: Current")
    expect(currentHtml).not.toContain("disabled=\"\"")
    expect(currentHtml).toContain("Replace the current approved prompt")

    const missingHtml = renderToStaticMarkup(
      createElement(FeaturedImagePromptForm, {
        state: {
          ...currentState,
          promptStatus: "missing",
          current: null,
          canGenerate: false,
        },
        draftPrompt: "",
        onDraftPromptChange: vi.fn(),
        replace: false,
        onReplaceChange: vi.fn(),
        saving: false,
        generating: false,
        message: "",
        generationError: "",
        onApprove: vi.fn(),
        onGenerate: vi.fn(),
      }),
    )
    expect(missingHtml).toContain("Status: Missing")
    expect(missingHtml).toContain("Generation stays blocked")
    expect(missingHtml).toContain("disabled=\"\"")
  })

  it("shows historical-stale prompt text without treating it as current", () => {
    const html = renderToStaticMarkup(
      createElement(FeaturedImagePromptForm, {
        state: {
          ...currentState,
          promptStatus: "historical-stale",
          current: null,
          canGenerate: false,
          historicalStale: [
            {
              prompt: ARTICLE_2_FEATURED_IMAGE_PROMPT,
              approvedAt: "2026-09-15T10:11:34.592Z",
              approvedBy: "dphogeorge@gmail.com",
              contentFingerprint: "b".repeat(64),
              noteId: "old-prompt",
            },
          ],
        },
        draftPrompt: "",
        onDraftPromptChange: vi.fn(),
        replace: false,
        onReplaceChange: vi.fn(),
        saving: false,
        generating: false,
        message: "",
        generationError: "",
        onApprove: vi.fn(),
        onGenerate: vi.fn(),
      }),
    )

    expect(html).toContain("Status: Historical-stale")
    expect(html).toContain("Historical-stale prompt")
    expect(html).toContain("This text is not used for generation.")
    expect(html).toContain("Generation stays blocked")
  })
})
