import { buildActivationRisks, evaluateActivationRiskReadiness } from "./activation-risk"
import { buildActivationWaves, evaluateWaveCoverage } from "./activation-wave"
import { buildGuardrailTelemetrySignals, evaluateTelemetryCoverage } from "./guardrail-telemetry"
import { buildOperatorHoldpoints, evaluateHoldpointCoverage } from "./operator-holdpoint"
import { buildPilotCohorts, evaluatePilotCoverage } from "./pilot-cohort"
import { buildPromotionThresholds } from "./promotion-threshold"
import { buildRollbackDrills, evaluateRollbackCoverage } from "./rollback-drill"
import { buildTenantWaves } from "./tenant-wave"

export function buildEnterpriseBetaPilotReadiness() {
  const pilotCohorts = buildPilotCohorts()
  const tenantWaves = buildTenantWaves()
  const activationWaves = buildActivationWaves(tenantWaves)
  const operatorHoldpoints = buildOperatorHoldpoints()
  const telemetrySignals = buildGuardrailTelemetrySignals()
  const rollbackDrills = buildRollbackDrills()
  const promotionThresholds = buildPromotionThresholds()
  const activationRisks = buildActivationRisks()

  const pilotCoverage = evaluatePilotCoverage(pilotCohorts)
  const waveCoverage = evaluateWaveCoverage(activationWaves, tenantWaves)
  const holdpointCoverage = evaluateHoldpointCoverage(operatorHoldpoints)
  const telemetryCoverage = evaluateTelemetryCoverage(telemetrySignals)
  const rollbackCoverage = evaluateRollbackCoverage(rollbackDrills)
  const riskReadiness = evaluateActivationRiskReadiness(activationRisks)

  const pilotScore = pilotCoverage.score
  const waveScore = waveCoverage.score
  const telemetryScore = telemetryCoverage.score
  const holdpointScore = holdpointCoverage.score
  const betaReadiness = Math.round(
    [pilotScore, waveScore, telemetryScore, holdpointScore, rollbackCoverage.score].reduce(
      (sum, score) => sum + score,
      0
    ) / 5
  )

  return {
    ok: true,
    readOnly: true,
    previewOnly: true,
    reportOnly: true,
    runtimeActivation: false,
    authIntegration: false,
    providerInstallation: false,
    middleware: false,
    sessionsEnabled: false,
    jwtIssued: false,
    persistence: false,
    execution: false,
    publishing: false,
    schemaChanges: false,
    migrations: false,
    writesToPrisma: false,
    databaseWrites: false,
    graphWrites: false,
    openAiCalls: false,
    pilotCoverage: pilotCoverage.score,
    waveCoverage: waveCoverage.score,
    holdpointCoverage: holdpointCoverage.score,
    telemetryCoverage: telemetryCoverage.score,
    rollbackCoverage: rollbackCoverage.score,
    pilotScore,
    waveScore,
    telemetryScore,
    holdpointScore,
    betaReadiness,
    recommendedEB11:
      "EB-11 should define guarded tenant-expansion pilots with staged operational controls, evidence-backed promotion gates, and rollback drill attestations before broader activation.",
    pilotCohorts,
    tenantWaves,
    activationWaves,
    operatorHoldpoints,
    telemetrySignals,
    rollbackDrills,
    promotionThresholds,
    activationRisks,
    evaluations: {
      pilotCoverage,
      waveCoverage,
      holdpointCoverage,
      telemetryCoverage,
      rollbackCoverage,
      riskReadiness,
    },
  }
}
