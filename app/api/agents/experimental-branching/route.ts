import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

import { reinforcementClusteringAgent } from "../../../../lib/agents/reinforcement-clustering-agent"

import { strategicPolicyMutationAgent } from "../../../../lib/agents/strategic-policy-mutation-agent"

import { experimentalBranchingAgent } from "../../../../lib/agents/experimental-branching-agent"

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

    const result =
      experimentalBranchingAgent({
        evolvedPolicies:
          policyMutation.evolvedPolicies,
      })

    return NextResponse.json({
      ok: true,
      clustering,
      policyMutation,
      result,
    })
  } catch (error) {
    console.error(
      "Experimental branching failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Experimental branching failed",
      },
      {
        status: 500,
      }
    )
  }
}
