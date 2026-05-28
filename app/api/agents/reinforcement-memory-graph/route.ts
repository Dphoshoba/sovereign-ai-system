import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

import { reinforcementClusteringAgent } from "../../../../lib/agents/reinforcement-clustering-agent"

import { strategicPolicyMutationAgent } from "../../../../lib/agents/strategic-policy-mutation-agent"

import { experimentalBranchingAgent } from "../../../../lib/agents/experimental-branching-agent"

import { branchCompetitionAgent } from "../../../../lib/agents/branch-competition-agent"

import { reinforcementMemoryGraphAgent } from "../../../../lib/agents/reinforcement-memory-graph-agent"

export async function GET() {
  try {
    const memories =
      await prisma.videoPerformanceMemory.findMany({
        orderBy: {
          createdAt: "desc",
        },
      })

    const clustering =
      reinforcementClusteringAgent({
        memories,
      })

    const mutation =
      strategicPolicyMutationAgent({
        strategicDNA:
          clustering.strategicDNA,
      })

    const branching =
      experimentalBranchingAgent({
        evolvedPolicies:
          mutation.evolvedPolicies,
      })

    const competition =
      branchCompetitionAgent({
        branches:
          branching.experimentalBranches,
      })

    const result =
      reinforcementMemoryGraphAgent({
        rankedBranches:
          competition.rankedBranches,
      })

    return NextResponse.json({
      ok: true,
      clustering,
      mutation,
      branching,
      competition,
      result,
    })
  } catch (error) {
    console.error(
      "Reinforcement memory graph failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Reinforcement memory graph failed",
      },
      {
        status: 500,
      }
    )
  }
}
