import { buildIdentityMigrationCheckpoints } from "./identity-migration"
import { buildZeroDowntimeAuthControls } from "./zero-downtime-auth"

export type ProviderCutoverCheckpoint = {
  id: string
  checkpoint: "pre-cutover" | "shadow" | "pilot" | "rollout" | "fallback"
  required: boolean
  reportOnly: true
}

export function buildProviderCutoverCheckpoints(): ProviderCutoverCheckpoint[] {
  return [
    {
      id: "provider-cutover-pre-cutover",
      checkpoint: "pre-cutover",
      required: true,
      reportOnly: true,
    },
    {
      id: "provider-cutover-shadow",
      checkpoint: "shadow",
      required: true,
      reportOnly: true,
    },
    {
      id: "provider-cutover-pilot",
      checkpoint: "pilot",
      required: true,
      reportOnly: true,
    },
    {
      id: "provider-cutover-rollout",
      checkpoint: "rollout",
      required: true,
      reportOnly: true,
    },
    {
      id: "provider-cutover-fallback",
      checkpoint: "fallback",
      required: true,
      reportOnly: true,
    },
  ]
}

export function evaluateCutoverCoverage(
  checkpoints: ProviderCutoverCheckpoint[] = buildProviderCutoverCheckpoints()
) {
  const required = checkpoints.filter((checkpoint) => checkpoint.required).length
  const controls = buildZeroDowntimeAuthControls()
  const migrations = buildIdentityMigrationCheckpoints()

  return {
    score: Math.round(
      (required / checkpoints.length) * 45 +
        (controls.filter((control) => control.required).length / controls.length) * 25 +
        (migrations.filter((migration) => migration.required).length / migrations.length) * 20
    ),
    status: "PROVIDER_CUTOVER_DEFINED_REPORT_ONLY" as const,
    checkpointCount: checkpoints.length,
    runtimeEnabled: false,
  }
}
