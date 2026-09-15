import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const root = process.cwd()

describe("schema-neutral content-versioned research audits", () => {
  it("does not add fingerprint state to the Prisma schema", () => {
    const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8")

    expect(schema).not.toContain("contentFingerprint String?")
    expect(schema).not.toContain("@@unique([articleId, contentFingerprint])")
  })

  it("does not retain a feature migration", () => {
    expect(() =>
      readFileSync(
        join(
          root,
          "prisma/migrations/20260915103000_version_article_research_audits/migration.sql",
        ),
        "utf8",
      ),
    ).toThrow()
  })
})
