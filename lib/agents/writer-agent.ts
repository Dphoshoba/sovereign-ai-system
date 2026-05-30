type WriterInput = {
  title: string
  niche: string
  contentType: string
}

export function writerAgent(input: WriterInput) {
  return {
    autonomousWriterAgent: true,
    title: input.title,
    niche: input.niche,
    contentType: input.contentType,

    draftStructure: {
      introduction: true,
      keyPoints: [
        "Problem",
        "Opportunity",
        "Practical Application",
        "Future Outlook",
      ],
      conclusion: true,
      faq: true,
      seoReady: true,
    },

    writerDirective:
      `Generate source-grounded content for "${input.title}"`,

    nextStage:
      "Ready for fact checker agent.",
  }
}
