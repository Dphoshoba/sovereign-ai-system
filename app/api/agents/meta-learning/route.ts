import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

import { reinforcementClusteringAgent } from "../../../../lib/agents/reinforcement-clustering-agent"
import { strategicPolicyMutationAgent } from "../../../../lib/agents/strategic-policy-mutation-agent"
import { strategyEvolutionAgent } from "../../../../lib/agents/strategy-evolution-agent"
import { metaLearningAgent } from "../../../../lib/agents/meta-learning-agent"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

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

    const evolution =
      strategyEvolutionAgent(memories)

    const metaLearning =
      metaLearningAgent({
        policies:
          policyMutation.evolvedPolicies,
        clustering,
        evolution,
      })

    return NextResponse.json({
      ok: true,
      clustering,
      policyMutation,
      evolution,
      metaLearning,
    })
  } catch (error) {
    console.error(
      "Meta-learning failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error: "Meta-learning failed",
      },
      {
        status: 500,
      }
    )
  }
}
