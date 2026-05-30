type SEOInput = {
  title: string
  niche: string
  contentType: string
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function seoAgent(input: SEOInput) {
  const slug = toSlug(input.title)

  return {
    autonomousSEOAgent: true,
    title: input.title,
    niche: input.niche,
    contentType: input.contentType,

    seo: {
      slug,
      metaTitle: input.title,
      metaDescription: `${input.title} explored with wisdom, clarity and source-grounded insight for the ${input.niche} audience.`,
      keywords: [
        input.niche,
        "AI",
        "faith",
        "ethics",
        "technology",
        "wisdom",
      ],
      suggestedCategory: "AI Tools",
    },

    seoDirective:
      `Optimize "${input.title}" for search, clarity and trustworthy discovery`,

    nextStage: "Ready for MDX generator.",
  }
}
