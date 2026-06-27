import {
  buildProviderDecisionReport,
  buildProviderDecisionCheckpoints,
} from "./provider-decision"
import { evaluateProviderCoverage } from "./provider-comparison"
import { buildIdentityCheckpoints, evaluateIdentityCoverage } from "./identity-checkpoint"
import { evaluateSessionCoverage } from "./session-readiness"
import { evaluateClaimCoverage } from "./claim-readiness"

export function buildEnterpriseBetaSessionCheckpointReadiness() {
  const providerDecision = buildProviderDecisionReport()
  const providerCoverage = evaluateProviderCoverage(providerDecision.comparisons)
  const sessionCoverage = evaluateSessionCoverage()
  const claimCoverage = evaluateClaimCoverage()
  const identityCoverage = evaluateIdentityCoverage(buildIdentityCheckpoints())

  const checkpointCoverage = Math.round(
    [
      providerDecision.providerCoverage,
      sessionCoverage.score,
      claimCoverage.score,
      identityCoverage.score,
      Math.round(
        (buildProviderDecisionCheckpoints().filter((checkpoint) => checkpoint.complete)
          .length /
          buildProviderDecisionCheckpoints().length) *
          100
      ),
    ].reduce((sum, score) => sum + score, 0) / 5
  )

  const providerScore = providerDecision.providerCoverage
  const sessionScore = sessionCoverage.score
  const claimScore = claimCoverage.score
  const checkpointScore = checkpointCoverage

  const betaReadiness = Math.round(
    [providerScore, sessionScore, claimScore, checkpointScore, identityCoverage.score].reduce(
      (sum, score) => sum + score,
      0
    ) / 5
  )

  return {
    ok: true,
    readOnly: true,
    previewOnly: true,
    reportOnly: true,
    authIntegration: false,
    providerInstallation: false,
    sessionsEnabled: false,
    jwtIssued: false,
    middleware: false,
    persistence: false,
    execution: false,
    publishing: false,
    schemaChanges: false,
    migrations: false,
    writesToPrisma: false,
    databaseWrites: false,
    graphWrites: false,
    openAiCalls: false,
    providerScore,
    sessionScore,
    claimScore,
    checkpointScore,
    betaReadiness,
    providerCoverage: providerCoverage.score,
    sessionCoverage: sessionScore,
    claimCoverage: claimScore,
    checkpointCoverage: checkpointScore,
    identityCoverage: identityCoverage.score,
    recommendedEB7:
      "EB-7 should convert provider selection into a constrained implementation plan with session bootstrap guards, claim validation hooks, and zero-downtime rollout checkpoints before runtime auth activation.",
    providerDecision,
    evaluations: {
      providerCoverage,
      sessionCoverage: {
        score: sessionCoverage.score,
        status: sessionCoverage.status,
      },
      claimCoverage: {
        score: claimCoverage.score,
        status: claimCoverage.status,
      },
      checkpointCoverage: {
        score: checkpointScore,
        status: "AUTH_CHECKPOINTS_READY_REPORT_ONLY" as const,
      },
      identityCoverage,
    },
  }
}
