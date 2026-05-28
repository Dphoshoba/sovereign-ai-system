import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

import { reinforcementClusteringAgent } from "../../../../lib/agents/reinforcement-clustering-agent"
import { strategicPolicyMutationAgent } from "../../../../lib/agents/strategic-policy-mutation-agent"
import { experimentalBranchingAgent } from "../../../../lib/agents/experimental-branching-agent"
import { branchCompetitionAgent } from "../../../../lib/agents/branch-competition-agent"
import { reinforcementMemoryGraphAgent } from "../../../../lib/agents/reinforcement-memory-graph-agent"
import { strategicForecastingAgent } from "../../../../lib/agents/strategic-forecasting-agent"
import { civilizationSimulationAgent } from "../../../../lib/agents/civilization-simulation-agent"
import { globalAttentionRoutingAgent } from "../../../../lib/agents/global-attention-routing-agent"

export async function GET() {
  try {
    const memories =
      await prisma.videoPerformanceMemory.findMany({
        orderBy: {
          createdAt: "desc",
        },
      })

    const clustering =
      reinforcementClusteringAgent({ memories })

    const mutation =
      strategicPolicyMutationAgent({
        strategicDNA: clustering.strategicDNA,
      })

    const branching =
      experimentalBranchingAgent({
        evolvedPolicies: mutation.evolvedPolicies,
      })

    const competition =
      branchCompetitionAgent({
        branches: branching.experimentalBranches,
      })

    const memoryGraph =
      reinforcementMemoryGraphAgent({
        rankedBranches: competition.rankedBranches,
      })

    const forecasting =
      strategicForecastingAgent({
        memoryNodes: memoryGraph.memoryNodes,
      })

    const civilization =
      civilizationSimulationAgent({
        dominantBranch:
          forecasting.dominantForecast.branchId,
        projectedDominance:
          forecasting.dominantForecast.projectedDominance,
      })

    const result =
      globalAttentionRoutingAgent({
        dominantScenario:
          civilization.dominantScenario,
      })

    return NextResponse.json({
      ok: true,
      forecasting,
      civilization,
      result,
    })
  } catch (error) {
    console.error(
      "Global attention routing failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Global attention routing failed",
      },
      {
        status: 500,
      }
    )
  }
}
