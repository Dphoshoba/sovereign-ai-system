import { buildAuthRolloutCheckpoints } from "./auth-rollout-checkpoints"
import { buildClaimValidationRules, evaluateClaimValidationCoverage } from "./claim-validator"
import { evaluateMigrationCoverage } from "./identity-migration"
import { evaluateBootstrapCoverage } from "./bootstrap-readiness"
import { evaluateCutoverCoverage } from "./provider-cutover"
import { buildProviderRolloutStages, evaluateRolloutCoverage } from "./provider-rollout"

export function buildEnterpriseBetaRolloutReadiness() {
  const rolloutStages = buildProviderRolloutStages()
  const rolloutCoverage = evaluateRolloutCoverage(rolloutStages)
  const bootstrapCoverage = evaluateBootstrapCoverage()
  const claimValidationCoverage = evaluateClaimValidationCoverage(buildClaimValidationRules())
  const cutoverCoverage = evaluateCutoverCoverage()
  const migrationCoverage = evaluateMigrationCoverage()

  const checkpoints = buildAuthRolloutCheckpoints()
  const checkpointFactor = Math.round(
    (checkpoints.filter((checkpoint) => checkpoint.complete).length / checkpoints.length) * 100
  )

  const rolloutScore = Math.round((rolloutCoverage.score + checkpointFactor) / 2)
  const bootstrapScore = bootstrapCoverage.score
  const validationScore = claimValidationCoverage.score
  const cutoverScore = cutoverCoverage.score
  const betaReadiness = Math.round(
    [
      rolloutScore,
      bootstrapScore,
      validationScore,
      cutoverScore,
      migrationCoverage.score,
    ].reduce((sum, score) => sum + score, 0) / 5
  )

  return {
    ok: true,
    readOnly: true,
    previewOnly: true,
    reportOnly: true,
    authRuntimeActivation: false,
    authIntegration: false,
    providerIntegration: false,
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
    rolloutCoverage: rolloutCoverage.score,
    bootstrapCoverage: bootstrapCoverage.score,
    claimValidationCoverage: claimValidationCoverage.score,
    cutoverCoverage: cutoverCoverage.score,
    migrationCoverage: migrationCoverage.score,
    rolloutScore,
    bootstrapScore,
    validationScore,
    cutoverScore,
    betaReadiness,
    recommendedEB8:
      "EB-8 should define a constrained runtime-auth dry run with feature-flag boundaries, tenant-scoped rollback checkpoints, and explicit go/no-go criteria before any activation.",
    rolloutStages,
    checkpoints,
    evaluations: {
      rolloutCoverage,
      bootstrapCoverage: {
        score: bootstrapCoverage.score,
        status: bootstrapCoverage.status,
      },
      claimValidationCoverage,
      cutoverCoverage,
      migrationCoverage,
    },
  }
}
