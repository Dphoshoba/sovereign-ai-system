import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

function listFiles(relativePath: string): string[] {
  const files: string[] = []
  const visit = (path: string) => {
    const absolute = join(process.cwd(), path)
    const stats = statSync(absolute)
    if (stats.isFile()) {
      if (path.endsWith(".ts") || path.endsWith(".tsx")) {
        files.push(path.replaceAll("\\", "/"))
      }
      return
    }
    for (const entry of readdirSync(absolute)) {
      if (entry === "node_modules" || entry === ".next") continue
      visit(join(path, entry))
    }
  }
  visit(relativePath)
  return files
}

describe("public blog article renderer inventory", () => {
  it("keeps a single public published-article route", () => {
    const appFiles = listFiles("app")
    const publicArticlePages = appFiles.filter((file) => {
      if (!file.includes("/blog/") || !file.endsWith("page.tsx")) return false
      const source = readFileSync(join(process.cwd(), file), "utf8")
      return source.includes("PublishedArticleView") || source.includes("ReactMarkdown")
    })

    expect(publicArticlePages).toEqual(["app/blog/[slug]/page.tsx"])
  })

  it("does not render content/blog MDX through the public article route", () => {
    const source = readFileSync(
      join(process.cwd(), "app/blog/[slug]/page.tsx"),
      "utf8",
    )

    expect(source).toContain("PublishedArticleView")
    expect(source).not.toContain("content/blog")
    expect(source).not.toContain("article.createdAt")
    expect(source).not.toContain("objectFit: \"cover\"")
  })

  it("does not write Article or ResearchSource records from the display layer", () => {
    const files = [
      "lib/blog/published-article-display.ts",
      "src/components/blog/PublishedArticleBody.tsx",
      "src/components/blog/PublishedArticleView.tsx",
      "src/components/public/StrategySessionCta.tsx",
      "app/blog/[slug]/page.tsx",
    ]

    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), "utf8")
      expect(source).not.toMatch(/article\.(update|create|delete)/)
      expect(source).not.toMatch(/researchSource\.(update|create|delete|upsert)/)
      expect(source).not.toContain("computeArticleAuditFingerprint")
      expect(source).not.toContain("prepareArticleForReview")
    }
  })

  it("keeps public navigation and CTAs off the nonexistent /contact route", () => {
    const publicRoots = ["app", "src/components"]
    const contactHref = /href\s*=\s*['"`{\s]*\/contact['"`}]/
    const offenders: string[] = []

    for (const root of publicRoots) {
      for (const file of listFiles(root)) {
        if (file.includes("/admin/") || file.includes("/api/")) continue
        const source = readFileSync(join(process.cwd(), file), "utf8")
        if (contactHref.test(source)) offenders.push(file)
      }
    }

    expect(offenders).toEqual([])

    const cta = readFileSync(
      join(process.cwd(), "src/components/public/StrategySessionCta.tsx"),
      "utf8",
    )
    expect(cta).toContain('"/consultation"')
    expect(cta).toContain("Book a Strategy Session →")
    expect(cta).not.toContain("/contact")
  })
})
