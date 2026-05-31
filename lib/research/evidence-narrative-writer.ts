export function evidenceNarrativeWriter(
  facts: string[]
): string {
  if (facts.length === 0) {
    return "This section requires verified facts before publication."
  }

  if (facts.length === 1) {
    return facts[0]
  }

  return facts
    .map((fact, index) => {
      if (index === 0) return fact

      return fact
        .replace(/^AI-enabled systems can /, "They can ")
        .replace(/^AI systems can /, "They can ")
        .replace(/^Generative AI can /, "It can ")
        .replace(/^Machine learning and deep learning are /, "Machine learning and deep learning are also ")
    })
    .join(" ")
}
