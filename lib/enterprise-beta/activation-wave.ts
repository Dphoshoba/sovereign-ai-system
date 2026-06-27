import { buildTenantWaves, type TenantWave } from "./tenant-wave"

export type ActivationWave = {
  id: string
  title: string
  tenantWaveId: string
  requiresOperatorHoldpoint: boolean
  requiresTelemetryGate: boolean
  reportOnly: true
}

export function buildActivationWaves(
  tenantWaves: TenantWave[] = buildTenantWaves()
): ActivationWave[] {
  return tenantWaves.map((wave) => ({
    id: `activation-${wave.id}`,
    title: `Activation plan for ${wave.wave}`,
    tenantWaveId: wave.id,
    requiresOperatorHoldpoint: true,
    requiresTelemetryGate: true,
    reportOnly: true,
  }))
}

export function evaluateWaveCoverage(
  waves: ActivationWave[] = buildActivationWaves(),
  tenantWaves: TenantWave[] = buildTenantWaves()
) {
  const holdpointBound = waves.filter((wave) => wave.requiresOperatorHoldpoint).length
  const telemetryBound = waves.filter((wave) => wave.requiresTelemetryGate).length

  return {
    score: Math.round(
      (waves.length / tenantWaves.length) * 35 +
        (holdpointBound / waves.length) * 25 +
        (telemetryBound / waves.length) * 30
    ),
    status: "ACTIVATION_WAVES_DEFINED_REPORT_ONLY" as const,
    waveCount: waves.length,
  }
}
