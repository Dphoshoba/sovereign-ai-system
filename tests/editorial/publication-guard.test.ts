import { describe, expect, it } from "vitest"
import { publicationGuard } from "../../lib/publishing/publication-guard"

describe("publicationGuard research-audit currency", () => {
  it("rejects an approved article with only stale audits", () => {
    const result = publicationGuard("approved", { hasCurrentAudit: false })

    expect(result.allowed).toBe(false)
    expect(result.reason).toContain("current research audit")
  })

  it("allows an approved article with a current matching audit", () => {
    const result = publicationGuard("approved", { hasCurrentAudit: true })

    expect(result.allowed).toBe(true)
  })

  it("rejects a scheduled article after its audit becomes stale", () => {
    const result = publicationGuard("scheduled", { hasCurrentAudit: false })

    expect(result.allowed).toBe(false)
    expect(result.reason).toContain("current research audit")
  })
})
