import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.packetId) {
      return NextResponse.json(
        { ok: false, error: "packetId is required" },
        { status: 400 }
      )
    }

    const packet = await prisma.federatedIntelligencePacket.findUnique({
      where: { id: body.packetId },
    })

    if (!packet) {
      return NextResponse.json(
        { ok: false, error: "Packet not found" },
        { status: 404 }
      )
    }

    if (
      packet.status === "approval-aware" ||
      packet.classification === "governance" ||
      ["high", "critical"].includes(packet.priority)
    ) {
      const auth = await prisma.executionAuthorizationRequest.create({
        data: {
          title: `Approve Federated Packet Dispatch: ${packet.title}`,
          targetType: "FederatedIntelligencePacket",
          targetId: packet.id,
          requestedBy: "federated-mesh",
          requestedRole: "system",
          actionType: "dispatch-packet",
          targetLayer: "federation",
          riskLevel:
            packet.priority === "critical"
              ? "critical"
              : packet.priority === "high"
                ? "high"
                : "medium",
          status: "pending",
          rationale: packet.summary || null,
          payload: {
            packetId: packet.id,
            classification: packet.classification,
          },
        },
      })

      const updated = await prisma.federatedIntelligencePacket.update({
        where: { id: packet.id },
        data: { status: "approval-requested" },
      })

      return NextResponse.json({
        ok: true,
        packet: updated,
        authorizationRequest: auth,
      })
    }

    const updated = await prisma.federatedIntelligencePacket.update({
      where: { id: packet.id },
      data: {
        status: "dispatched",
      },
    })

    await prisma.realtimeEventMessage.create({
      data: {
        streamName: "intelligence",
        eventType: "federated-packet-dispatched",
        source: "federated-mesh",
        title: packet.title,
        message: packet.summary || null,
        priority: packet.priority,
        status: "pending",
        payload: {
          packetId: packet.id,
          sourceNodeId: packet.sourceNodeId,
          targetNodeId: packet.targetNodeId,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      packet: updated,
    })
  } catch (error) {
    console.error("Packet dispatch failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Packet dispatch failed",
      },
      { status: 500 }
    )
  }
}