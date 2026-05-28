import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

import { reinforcementClusteringAgent } from "../../../../lib/agents/reinforcement-clustering-agent"

import { strategicPolicyMutationAgent } from "../../../../lib/agents/strategic-policy-mutation-agent"

import { experimentalBranchingAgent } from "../../../../lib/agents/experimental-branching-agent"

import { branchCompetitionAgent } from "../../../../lib/agents/branch-competition-agent"

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

    const policyMutation =
      strategicPolicyMutationAgent({
        strategicDNA:
          clustering.strategicDNA,
      })

    const branching =
      experimentalBranchingAgent({
        evolvedPolicies:
          policyMutation.evolvedPolicies,
      })

    const result =
      branchCompetitionAgent({
        branches:
          branching.experimentalBranches,
      })

    return NextResponse.json({
      ok: true,
      clustering,
      policyMutation,
      branching,
      result,
    })
  } catch (error) {
    console.error(
      "Branch competition failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Branch competition failed",
      },
      {
        status: 500,
      }
    )
  }
}
