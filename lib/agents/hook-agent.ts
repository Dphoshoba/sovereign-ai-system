export async function hookAgent(script: {
  title: string
  intro: string
  sections: string[]
}) {
  return {
    hooks: [
      "Most people use AI wrong",
      "This changes everything",
      "The future is automated",
    ],
  }
}
