import { evaluateAuditCoverage } from "./guard-audit"
import { evaluateDecisionCoverage } from "./guard-decision"
import { evaluateEvidenceCoverage } from "./guard-evidence"
import { buildGuardEvidencePackets, evaluateEvidencePacketReadiness } from "./guard-evidence-packet"
import { buildGuardExplainability } from "./guard-explainability"
import { buildGuardReasoning, evaluateReasoningCoverage } from "./guard-reasoning"
import { buildGuardAuditReadiness } from "./audit-readiness"
import { buildGuardAuditRecords } from "./guard-audit"
import { buildGuardDecisions } from "./guard-decision"
import { buildGuardEvidenceItems } from "./guard-evidence"

export function buildEnterpriseBetaDecisionReadiness() {
  const decisions = buildGuardDecisions()
  const evidence = buildGuardEvidenceItems(decisions)
  const packets = buildGuardEvidencePackets()
  const audits = buildGuardAuditRecords()
  const reasoning = buildGuardReasoning(decisions)

  const decisionCoverage = evaluateDecisionCoverage(decisions)
  const evidenceCoverage = evaluateEvidenceCoverage(evidence)
  const packetReadiness = evaluateEvidencePacketReadiness(packets)
  const auditCoverage = evaluateAuditCoverage(audits)
  const reasoningCoverage = evaluateReasoningCoverage(reasoning)
  const explainability = buildGuardExplainability()
  const auditReadiness = buildGuardAuditReadiness()

  const decisionScore = decisionCoverage.score
  const evidenceScore = Math.round((evidenceCoverage.score + packetReadiness.score) / 2)
  const auditScore = auditCoverage.score
  const explainabilityScore = explainability.score
  const guardReadiness = Math.round(
    [decisionScore, evidenceScore, auditScore, explainabilityScore].reduce(
      (sum, score) => sum + score,
      0
    ) / 4
  )
  const betaReadiness = Math.round(
    [guardReadiness, auditReadiness.score, reasoningCoverage.score].reduce(
      (sum, score) => sum + score,
      0
    ) / 3
  )

  return {
    ok: true,
    readOnly: true,
    previewOnly: true,
    reportOnly: true,
    middleware: false,
    persistence: false,
    writesToPrisma: false,
    databaseWrites: false,
    schemaChanges: false,
    migrations: false,
    execution: false,
    publishing: false,
    graphWrites: false,
    graphDeletes: false,
    openAiCalls: false,
    authIntegration: false,
    providerInstallation: false,
    sessionsEnabled: false,
    jwtIssued: false,
    decisionScore,
    evidenceScore,
    auditScore,
    explainabilityScore,
    betaReadiness,
    decisionCoverage: decisionCoverage.score,
    evidenceCoverage: evidenceScore,
    auditCoverage: auditCoverage.score,
    explainabilityReadiness: explainability.score,
    guardReadiness,
    recommendedEB4:
      "EB-4 should define report-only rate-limit and abuse-boundary planning before any middleware, sessions, JWT, provider integration, persistence, or enforcement.",
    decisions,
    evidence,
    packets,
    audits,
    reasoning,
    evaluations: {
      decisionCoverage,
      evidenceCoverage,
      packetReadiness,
      auditCoverage,
      reasoningCoverage,
      explainability,
      auditReadiness,
    },
  }
}
