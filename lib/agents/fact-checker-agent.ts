type FactCheckerInput = {
  title: string
}

export function factCheckerAgent(
  input: FactCheckerInput
) {
  const verificationRules = [
    "No invented statistics",
    "No invented quotes",
    "No invented companies",
    "No invented studies",
    "No unsupported factual claims",
    "All factual claims require sources",
  ]

  return {
    autonomousFactCheckerAgent: true,
    title: input.title,

    verificationRules,

    factCheckingDirective:
      `Verify all claims for "${input.title}" before publication`,

    publicationStatus:
      "Requires verification before publish",

    nextStage:
      "Ready for SEO agent.",
  }
}
