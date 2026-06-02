import { NextRequest, NextResponse } from "next/server"

import { researchAgent } from "../../../../lib/agents/research-agent"
import { contentPlannerAgent } from "../../../../lib/agents/content-planner-agent"
import { writerAgent } from "../../../../lib/agents/writer-agent"
import { factCheckerAgent } from "../../../../lib/agents/fact-checker-agent"
import { seoAgent } from "../../../../lib/agents/seo-agent"
import { mdxGeneratorAgent } from "../../../../lib/agents/mdx-generator-agent"
import { publisherAgent } from "../../../../lib/agents/publisher-agent"
import { analyticsAgent } from "../../../../lib/agents/analytics-agent"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const niche = body.niche || "AI + Faith"

    const research = researchAgent({ niche })

    const contentPlanner = contentPlannerAgent({
      niche,
      researchTopic: research.dominantResearch.topic,
    })

    const writer = writerAgent({
      title: contentPlanner.primaryAsset.title,
      niche,
      contentType: contentPlanner.primaryAsset.type,
    })

    const factChecker = factCheckerAgent({
      title: writer.title,
    })

    const seo = seoAgent({
      title: writer.title,
      niche,
      contentType: writer.contentType,
    })

    const mdxGenerator = mdxGeneratorAgent({
      title: writer.title,
      slug: seo.seo.slug,
      category: seo.seo.suggestedCategory
        .toLowerCase()
        .replace(/\s+/g, "-"),
    })

    const publisher = publisherAgent({
      title: writer.title,
      mdxPath: mdxGenerator.mdxPath,
      status: "review-required",
    })

    const analytics = analyticsAgent({
      title: writer.title,
      status: publisher.currentStatus,
    })

    return NextResponse.json({
      ok: true,
      workflowName: "AI + Faith Blog Automation Workflow",
      status: "draft-ready",
      humanReviewRequired: true,
      publishReady: false,

      summary: {
        niche,
        title: writer.title,
        slug: seo.seo.slug,
        category: mdxGenerator.category,
        mdxPath: mdxGenerator.mdxPath,
        publicationStatus: publisher.publicationStatus,
        nextStage:
          "Replace placeholder agents with real web research, source collection and MDX file writing.",
      },

      stack: {
        research,
        contentPlanner,
        writer,
        factChecker,
        seo,
        mdxGenerator,
        publisher,
        analytics,
      },
    })
  } catch (error) {
    console.error("Execution workflow synthesis failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Execution workflow synthesis failed",
      },
      { status: 500 }
    )
  }
}
