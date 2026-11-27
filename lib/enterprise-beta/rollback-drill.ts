import { buildTenantWaves } from "./tenant-wave"

export type RollbackDrill = {
  id: string
  drill: "tenant-disable-drill" | "wave-revert-drill" | "operator-escalation-drill"
  required: boolean
  slaBoundMinutes: number
  reportOnly: true
}

export function buildRollbackDrills(): RollbackDrill[] {
  return [
    {
      id: "rollback-drill-tenant-disable",
      drill: "tenant-disable-drill",
      required: true,
      slaBoundMinutes: 5,
      reportOnly: true,
    },
    {
      id: "rollback-drill-wave-revert",
      drill: "wave-revert-drill",
      required: true,
      slaBoundMinutes: 15,
      reportOnly: true,
    },
    {
      id: "rollback-drill-operator-escalation",
      drill: "operator-escalation-drill",
      required: true,
      slaBoundMinutes: 10,
      reportOnly: true,
    },
  ]
}

export function evaluateRollbackCoverage(
  drills: RollbackDrill[] = buildRollbackDrills()
) {
  const required = drills.filter((drill) => drill.required).length
  const slaBound = drills.filter((drill) => drill.slaBoundMinutes <= 15).length
  const waveCount = buildTenantWaves().length

  return {
    score: Math.round(
      (required / drills.length) * 50 + (slaBound / drills.length) * 25 + Math.min(waveCount * 8, 20)
    ),
    status: "ROLLBACK_DRILLS_DEFINED_REPORT_ONLY" as const,
    drillCount: drills.length,
  }
}
