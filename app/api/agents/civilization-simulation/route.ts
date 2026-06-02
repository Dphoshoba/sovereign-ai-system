import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

import { reinforcementClusteringAgent } from "../../../../lib/agents/reinforcement-clustering-agent"

import { strategicPolicyMutationAgent } from "../../../../lib/agents/strategic-policy-mutation-agent"

import { experimentalBranchingAgent } from "../../../../lib/agents/experimental-branching-agent"

import { branchCompetitionAgent } from "../../../../lib/agents/branch-competition-agent"

import { reinforcementMemoryGraphAgent } from "../../../../lib/agents/reinforcement-memory-graph-agent"

import { strategicForecastingAgent } from "../../../../lib/agents/strategic-forecasting-agent"

import { civilizationSimulationAgent } from "../../../../lib/agents/civilization-simulation-agent"

export async function GET() {
  try {
    const memories =
      await prisma.videoPerformanceMemory.findMany({
        orderBy: {
          createdAt: "desc",
        },
      })

    const safeMemories = memories.map((memory) => ({
      ...memory,
      title: memory.title ?? "Untitled",
    }))

    const clustering =
      reinforcementClusteringAgent({
        memories: safeMemories,
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

    const memoryGraph =
      reinforcementMemoryGraphAgent({
        rankedBranches:
          competition.rankedBranches,
      })

    const forecasting =
      strategicForecastingAgent({
        memoryNodes:
          memoryGraph.memoryNodes,
      })

    const result =
      civilizationSimulationAgent({
        dominantBranch:
          forecasting.dominantForecast.branchId,

        projectedDominance:
          forecasting.dominantForecast.projectedDominance,
      })

    return NextResponse.json({
      ok: true,
      clustering,
      mutation,
      branching,
      competition,
      memoryGraph,
      forecasting,
      result,
    })
  } catch (error) {
    console.error(
      "Civilization simulation failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Civilization simulation failed",
      },
      {
        status: 500,
      }
    )
  }
}
