import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function sendEmailExecution(emailId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/email-execution/send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ emailId }),
    }
  )

  const result = await response.json()

  if (!response.ok || !result.ok) {
    throw new Error(result.error || "Email send failed")
  }

  return result
}

export async function POST() {
  try {
    const decisions = await prisma.orchestrationDecision.findMany({
      where: {
        status: "proposed",
        decisionType: "create_tool_action",
        targetSystem: "tool-gateway",
      },
      orderBy: { createdAt: "asc" },
      take: 10,
    })

    const results: any[] = []

    for (const decision of decisions) {
      const payload = decision.payload as {
        action?: string
        emailId?: string
        provider?: string
        idempotencyKey?: string
      }

      if (payload.action !== "email.send" || !payload.emailId) {
        const skipped = await prisma.orchestrationDecision.update({
          where: { id: decision.id },
          data: {
            status: "skipped",
            error: "Unsupported tool action",
          },
        })

        results.push(skipped)
        continue
      }

      const email = await prisma.emailExecution.findUnique({
        where: { id: payload.emailId },
      })

      if (!email) {
        const failed = await prisma.orchestrationDecision.update({
          where: { id: decision.id },
          data: {
            status: "failed",
            error: "Email execution not found",
          },
        })

        results.push(failed)
        continue
      }

      if (email.status === "sent") {
        const completed = await prisma.orchestrationDecision.update({
          where: { id: decision.id },
          data: {
            status: "completed",
            result: {
              emailId: email.id,
              status: email.status,
              providerId: email.providerId,
              message: "Email was already sent",
            },
          },
        })

        results.push(completed)
        continue
      }

      if (!email.approved) {
        const blocked = await prisma.orchestrationDecision.update({
          where: { id: decision.id },
          data: {
            status: "blocked",
            error: "Email is not approved",
          },
        })

        results.push(blocked)
        continue
      }

      const sendResult = await sendEmailExecution(email.id)

      const completed = await prisma.orchestrationDecision.update({
        where: { id: decision.id },
        data: {
          status: "completed",
          result: {
            emailId: email.id,
            providerId: sendResult.provider?.id || null,
            message: "Email sent by orchestration executor",
          },
        },
      })

      await prisma.operationalEvent.create({
        data: {
          type: "orchestration-action-executed",
          source: "orchestration-kernel",
          title: `Executed: ${decision.title}`,
          message: "Tool action completed successfully.",
          severity: "info",
          entityType: "OrchestrationDecision",
          entityId: decision.id,
          payload: {
            decisionId: decision.id,
            emailId: email.id,
          },
        },
      })

      results.push(completed)
    }

    const queuedEmails = await prisma.emailExecution.findMany({
      where: {
        approved: true,
        status: "queued",
      },
      orderBy: { createdAt: "asc" },
      take: 10,
    })

    for (const email of queuedEmails) {
      try {
        const sendResult = await sendEmailExecution(email.id)

        const event = await prisma.operationalEvent.create({
          data: {
            type: "queued-email-auto-sent",
            source: "orchestration-kernel",
            title: `Queued email auto-sent: ${email.subject}`,
            message: `Sent approved queued email to ${email.to}`,
            severity: "info",
            entityType: "EmailExecution",
            entityId: email.id,
            payload: {
              emailId: email.id,
              providerId: sendResult.provider?.id || null,
            },
          },
        })

        results.push({
          type: "queued-email-auto-sent",
          emailId: email.id,
          status: "completed",
          providerId: sendResult.provider?.id || null,
          eventId: event.id,
        })
      } catch (error) {
        const failed = await prisma.operationalEvent.create({
          data: {
            type: "queued-email-auto-send-failed",
            source: "orchestration-kernel",
            title: `Queued email auto-send failed: ${email.subject}`,
            message:
              error instanceof Error
                ? error.message
                : "Queued email auto-send failed",
            severity: "high",
            entityType: "EmailExecution",
            entityId: email.id,
            payload: {
              emailId: email.id,
            },
          },
        })

        results.push({
          type: "queued-email-auto-send-failed",
          emailId: email.id,
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Queued email auto-send failed",
          eventId: failed.id,
        })
      }
    }

    return NextResponse.json({
      ok: true,
      executed: results.length,
      decisionsExecuted: decisions.length,
      queuedEmailsExecuted: queuedEmails.length,
      results,
    })
  } catch (error) {
    console.error("Orchestration execution failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Execution failed",
      },
      { status: 500 }
    )
  }
}