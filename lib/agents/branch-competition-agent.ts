type Branch = {
  branchId: string
  hypothesis: string
}

type CompetitionInput = {
  branches: Branch[]
}

export function branchCompetitionAgent(
  input: CompetitionInput
) {
  const scoredBranches =
    input.branches.map((branch) => {
      const score =
        Math.floor(Math.random() * 30) + 70

      return {
        ...branch,
        evolutionaryScore: score,
      }
    })

  const ranked =
    scoredBranches.sort(
      (a, b) =>
        b.evolutionaryScore -
        a.evolutionaryScore
    )

  const dominantBranch = ranked[0]

  const archivedBranches =
    ranked.slice(1).filter(
      (b) =>
        b.evolutionaryScore < 85
    )

  return {
    autonomousBranchCompetition: true,

    rankedBranches: ranked,

    dominantBranch,

    archivedBranches,

    promotionDecision:
      `Promote branch "${dominantBranch.branchId}" into global strategic policy.`,

    nextEvolutionStage:
      "Ready for recursive branch reinforcement learning.",
  }
}
