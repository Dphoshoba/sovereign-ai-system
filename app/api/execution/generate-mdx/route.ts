import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function escapeYaml(value: string) {
  return `"${value.replace(/"/g, '\\"')}"`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const title = body.title || "The Future of AI and Faith"
    const niche = body.niche || "AI + Faith"
    const category = body.category || "ai-tools"
    const slug = body.slug || toSlug(title)

    const mdxDir = path.join(
      process.cwd(),
      "content",
      "blog",
      category
    )

    const mdxPath = path.join(mdxDir, `${slug}.mdx`)

    const content = `---
title: ${escapeYaml(title)}
slug: ${escapeYaml(slug)}
category: ${escapeYaml(category)}
excerpt: ${escapeYaml(
      `A draft article exploring ${title} with a source-grounded, anti-hallucination workflow.`
    )}
metaTitle: ${escapeYaml(title)}
metaDescription: ${escapeYaml(
      `${title} explored with wisdom, clarity and source-grounded insight for the ${niche} audience.`
    )}
keywords:
  - ${escapeYaml(niche)}
  - "AI"
  - "faith"
  - "ethics"
  - "technology"
  - "wisdom"
featuredImagePrompt: ${escapeYaml(
      `A thoughtful cinematic image representing ${title}, wisdom, technology and faith.`
    )}
publishedAt: ${escapeYaml(new Date().toISOString())}
author: "Echoes & Visions"
tags:
  - ${escapeYaml(niche)}
  - "AI"
  - "Faith"
ctaType: "default"
faq:
  - question: ${escapeYaml(`What is ${title} about?`)}
    answer: ${escapeYaml(
      "This draft is a placeholder created by the local MDX generator. It must be expanded with verified sources before publication."
    )}
internalLinks: []
status: "draft"
---

# ${title}

> Draft status: This article was generated as a local MDX draft. It must be expanded, fact-checked and reviewed before publication.

## Introduction

This draft explores **${title}** for the **${niche}** audience.

## Key Ideas

- The article must use verified sources.
- No invented statistics are allowed.
- No invented quotes are allowed.
- No unsupported factual claims should be published.
- Human review is required before publication.

## Working Outline

### 1. The Problem

Explain the key issue clearly.

### 2. The Opportunity

Show the constructive opportunity.

### 3. Practical Application

Give readers useful, grounded steps.

### 4. Future Outlook

Discuss future possibilities carefully without presenting predictions as facts.

## FAQ

### What should happen before publishing?

Add verified sources, check every factual claim and complete a human review.

## Conclusion

This article is ready for source-grounded expansion and editorial review.
`

    await fs.mkdir(mdxDir, { recursive: true })
    await fs.writeFile(mdxPath, content, "utf8")

    return NextResponse.json({
      ok: true,
      generated: true,
      status: "draft",
      title,
      niche,
      category,
      slug,
      mdxPath: `content/blog/${category}/${slug}.mdx`,
      message:
        "MDX draft generated successfully. Human review and fact-checking required before publication.",
    })
  } catch (error) {
    console.error("Generate MDX failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Generate MDX failed",
      },
      { status: 500 }
    )
  }
}
