import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const defaultRules = [
  {
    name: "Hot Lead Creator Follow-Up",
    description:
      "When a hot creator lead is detected, create follow-up task, email draft, mission task and operational event.",
    eventType: "hot-lead-detected",
    priority: "high",
    enabled: true,
    actions: [
      {
        actionType: "create-follow-up-task",
        title: "Create urgent creator follow-up task",
      },
      {
        actionType: "create-email-draft",
        title: "Draft hot lead outreach email",
      },
      {
        actionType: "create-mission-task",
        title: "Assign Creator Success mission",
      },
      {
        actionType: "create-operational-event",
        title: "Publish workflow activation event",
      },
    ],
  },
  {
    name: "Email Failure Recovery",
    description:
      "When email sending fails, trigger recovery alert and operational mission.",
    eventType: "email-send-failed",
    priority: "high",
    enabled: true,
    actions: [
      {
        actionType: "create-mission-task",
        title: "Investigate failed email delivery",
      },
      {
        actionType: "create-operational-event",
        title: "Escalate email delivery failure",
      },
    ],
  },
  {
    name: "Optimization Run Follow-Up",
    description:
      "When optimization completes, convert suggested actions into operational work.",
    eventType: "optimization-run-completed",
    priority: "medium",
    enabled: true,
    actions: [
      {
        actionType: "create-mission-task",
        title: "Review optimization findings",
      },
      {
        actionType: "create-operational-event",
        title: "Optimization workflow review needed",
      },
    ],
  },
]

export async function GET() {
  try {
    let rules = await prisma.workflowAutomationRule.findMany({
      orderBy: { createdAt: "asc" },
    })

    if (rules.length === 0) {
      await prisma.workflowAutomationRule.createMany({
        data: defaultRules,
      })

      rules = await prisma.workflowAutomationRule.findMany({
        orderBy: { createdAt: "asc" },
      })
    }

    const runs = await prisma.workflowAutomationRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    const steps = await prisma.workflowAutomationStep.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    return NextResponse.json({
      ok: true,
      rules,
      runs,
      steps,
    })
  } catch (error) {
    console.error("Workflow automation fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch workflow automation data" },
      { status: 500 }
    )
  }
}