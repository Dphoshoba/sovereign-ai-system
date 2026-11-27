import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import {
  canShowWithdrawForCorrection,
  WithdrawForCorrectionForm,
} from "../../app/admin/articles/WithdrawForCorrectionPanel"

describe("Withdraw for Correction admin control", () => {
  it("is available only for published articles", () => {
    expect(canShowWithdrawForCorrection("published")).toBe(true)
    expect(canShowWithdrawForCorrection("review-required")).toBe(false)
    expect(canShowWithdrawForCorrection("approved")).toBe(false)
    expect(canShowWithdrawForCorrection("scheduled")).toBe(false)
  })

  it("keeps the control closed until confirmed and requires a reason", () => {
    const closed = renderToStaticMarkup(
      createElement(WithdrawForCorrectionForm, {
        open: false,
        reason: "",
        error: "",
        submitting: false,
        onOpen: vi.fn(),
        onCancel: vi.fn(),
        onReasonChange: vi.fn(),
        onConfirm: vi.fn(),
      }),
    )
    expect(closed).toContain("Withdraw for Correction")
    expect(closed).not.toContain("Correction reason")
    expect(closed).not.toContain("immediately leave the public site")

    const opened = renderToStaticMarkup(
      createElement(WithdrawForCorrectionForm, {
        open: true,
        reason: "",
        error: "",
        submitting: false,
        onOpen: vi.fn(),
        onCancel: vi.fn(),
        onReasonChange: vi.fn(),
        onConfirm: vi.fn(),
      }),
    )
    expect(opened).toContain("immediately leave the public site")
    expect(opened).toContain("Prepare for Review, approval, and publication")
    expect(opened).toContain("disabled=\"\"")
    expect(opened).toContain("Confirm withdrawal")
  })

  it("shows the API error message instead of a generic failure", () => {
    const html = renderToStaticMarkup(
      createElement(WithdrawForCorrectionForm, {
        open: true,
        reason: "Correct 1 Samuel 17:32.",
        error: "Published article content cannot be edited in place.",
        submitting: false,
        onOpen: vi.fn(),
        onCancel: vi.fn(),
        onReasonChange: vi.fn(),
        onConfirm: vi.fn(),
      }),
    )
    expect(html).toContain("Published article content cannot be edited in place.")
    expect(html).not.toContain("Failed to update article")
    expect(html).not.toContain("disabled=\"\"")
  })
})
