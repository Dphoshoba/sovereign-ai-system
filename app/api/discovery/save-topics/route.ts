import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { topicDiscovery } from "../../../../lib/discovery/topic-discovery"
import { topicScorer } from "../../../../lib/discovery/topic-scorer"
import { topicOpportunityGenerator } from "../../../../lib/discovery/topic-opportunity-generator"

export async function POST() {
    try {
      const discovered = await topicDiscovery()
      const scored = topicScorer(discovered)
      const opportunities = topicOpportunityGenerator(scored)
  
      const saved = []
  
      for (const opportunity of opportunities) {
        const existing = await prisma.discoveredTopic.findFirst({
          where: {
            title: opportunity.title,
          },
        })
  
        if (existing) {
          continue
        }
  
        const topic = await prisma.discoveredTopic.create({
          data: {
            title: opportunity.title,
            sourceTitle: opportunity.sourceTitle,
            source: opportunity.sourceTitle,
            audience: opportunity.audience,
            angle: opportunity.angle,
            opportunityScore: opportunity.opportunityScore,
            status: "discovered",
          },
        })
  
        saved.push(topic)
      }
  
      return NextResponse.json({
        ok: true,
        discoveredCount: opportunities.length,
        savedCount: saved.length,
        saved,
      })
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to save discovered topics",
        },
        { status: 500 }
      )
    }
  }
  
  export async function GET() {
    return POST()
  }