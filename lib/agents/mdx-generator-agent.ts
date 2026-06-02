type MDXGeneratorInput = {
  title: string
  slug: string
  category: string
}

export function mdxGeneratorAgent(
  input: MDXGeneratorInput
) {
  const mdxPath = `content/blog/${input.category.toLowerCase()}/${input.slug}.mdx`

  return {
    autonomousMDXGeneratorAgent: true,
    title: input.title,
    slug: input.slug,
    category: input.category,

    frontmatter: {
      title: input.title,
      slug: input.slug,
      category: input.category,
      author: "Echoes & Visions",
      ctaType: "default",
      status: "review-required",
    },

    mdxPath,

    mdxDirective:
      `Generate MDX article at ${mdxPath}`,

    nextStage:
      "Ready for publisher agent.",
  }
}
