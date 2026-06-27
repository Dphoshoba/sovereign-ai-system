import {
  buildAuditPersistenceModels,
  evaluateAuditPersistenceCoverage,
} from "./audit-persistence-model"
import { buildAuditRedactionPolicies, evaluateRedactionCoverage } from "./audit-redaction"
import { buildAuditStorageStrategies, evaluateStorageCoverage } from "./audit-storage-strategy"
import { buildImmutableAuditControls, evaluateImmutabilityCoverage } from "./immutable-audit"
import { buildRetentionReadiness } from "./retention-readiness"

export function buildEnterpriseBetaPersistenceReadiness() {
  const persistenceModels = buildAuditPersistenceModels()
  const storageStrategies = buildAuditStorageStrategies()
  const redactionPolicies = buildAuditRedactionPolicies()
  const immutableControls = buildImmutableAuditControls()
  const retentionReadiness = buildRetentionReadiness()

  const auditCoverage = evaluateAuditPersistenceCoverage(persistenceModels)
  const storageCoverage = evaluateStorageCoverage(storageStrategies)
  const redactionCoverage = evaluateRedactionCoverage(redactionPolicies)
  const immutabilityCoverage = evaluateImmutabilityCoverage(immutableControls)

  const retentionScore = retentionReadiness.score
  const storageScore = storageCoverage.score
  const immutabilityScore = immutabilityCoverage.score
  const redactionScore = redactionCoverage.score
  const auditScore = auditCoverage.score
  const betaReadiness = Math.round(
    [retentionScore, storageScore, immutabilityScore, redactionScore, auditScore].reduce(
      (sum, score) => sum + score,
      0
    ) / 5
  )

  return {
    ok: true,
    readOnly: true,
    previewOnly: true,
    reportOnly: true,
    middleware: false,
    persistence: false,
    persistenceImplementation: false,
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
    retentionScore,
    storageScore,
    immutabilityScore,
    redactionScore,
    betaReadiness,
    retentionCoverage: retentionScore,
    storageCoverage: storageScore,
    immutabilityCoverage: immutabilityScore,
    redactionCoverage: redactionScore,
    auditCoverage: auditScore,
    recommendedEB6:
      "EB-6 should define report-only provider decision and session implementation checkpoints before any auth integration, sessions, JWT, middleware, persistence, or database writes.",
    persistenceModels,
    storageStrategies,
    redactionPolicies,
    immutableControls,
    retentionReadiness,
    evaluations: {
      auditCoverage,
      storageCoverage,
      redactionCoverage,
      immutabilityCoverage,
      retentionReadiness,
    },
  }
}
