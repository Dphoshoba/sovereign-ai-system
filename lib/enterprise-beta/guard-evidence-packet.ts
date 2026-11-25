import { buildGuardDecisions } from "./guard-decision"
import { buildGuardEvidenceItems } from "./guard-evidence"
import { buildGuardReasoning } from "./guard-reasoning"

export type GuardEvidencePacket = {
  id: string
  decisionId: string
  routePattern: string
  evidenceIds: string[]
  reasoningId: string
  operatorVisible: true
  persisted: false
}

export function buildGuardEvidencePackets(): GuardEvidencePacket[] {
  const decisions = buildGuardDecisions()
  const evidence = buildGuardEvidenceItems(decisions)
  const reasoning = buildGuardReasoning(decisions)

  return decisions.map((decision) => ({
    id: `${decision.id}-packet`,
    decisionId: decision.id,
    routePattern: decision.routePattern,
    evidenceIds: evidence
      .filter((item) => item.decisionId === decision.id)
      .map((item) => item.id),
    reasoningId:
      reasoning.find((item) => item.decisionId === decision.id)?.id ??
      `${decision.id}-reasoning`,
    operatorVisible: true,
    persisted: false,
  }))
}

export function evaluateEvidencePacketReadiness(
  packets: GuardEvidencePacket[] = buildGuardEvidencePackets()
) {
  const complete = packets.filter(
    (packet) => packet.evidenceIds.length > 0 && packet.reasoningId
  ).length

  return {
    score: Math.round((complete / packets.length) * 86),
    status: "EVIDENCE_PACKETS_READY_REPORT_ONLY" as const,
    packetCount: packets.length,
    persisted: false,
  }
}
