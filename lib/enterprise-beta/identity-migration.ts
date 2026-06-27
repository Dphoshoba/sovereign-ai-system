export type IdentityMigrationCheckpoint = {
  id: string
  phase: "inventory" | "mapping" | "shadow-verify" | "fallback-plan" | "signoff"
  required: boolean
  reportOnly: true
  runtimeEnabled: false
}

export function buildIdentityMigrationCheckpoints(): IdentityMigrationCheckpoint[] {
  return [
    {
      id: "identity-migration-inventory",
      phase: "inventory",
      required: true,
      reportOnly: true,
      runtimeEnabled: false,
    },
    {
      id: "identity-migration-mapping",
      phase: "mapping",
      required: true,
      reportOnly: true,
      runtimeEnabled: false,
    },
    {
      id: "identity-migration-shadow-verify",
      phase: "shadow-verify",
      required: true,
      reportOnly: true,
      runtimeEnabled: false,
    },
    {
      id: "identity-migration-fallback-plan",
      phase: "fallback-plan",
      required: true,
      reportOnly: true,
      runtimeEnabled: false,
    },
    {
      id: "identity-migration-signoff",
      phase: "signoff",
      required: true,
      reportOnly: true,
      runtimeEnabled: false,
    },
  ]
}

export function evaluateMigrationCoverage(
  checkpoints: IdentityMigrationCheckpoint[] = buildIdentityMigrationCheckpoints()
) {
  const required = checkpoints.filter((checkpoint) => checkpoint.required).length

  return {
    score: Math.round((required / checkpoints.length) * 88),
    status: "IDENTITY_MIGRATION_DEFINED_REPORT_ONLY" as const,
    checkpointCount: checkpoints.length,
    runtimeEnabled: false,
  }
}
