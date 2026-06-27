export type RollbackSlaCheckpoint = {
  id: string
  metric: "detect-to-disable" | "disable-to-stabilize" | "tenant-recovery" | "operator-escalation"
  targetMinutes: number
  required: boolean
  reportOnly: true
}

export function buildRollbackSlaCheckpoints(): RollbackSlaCheckpoint[] {
  return [
    {
      id: "rollback-sla-detect-disable",
      metric: "detect-to-disable",
      targetMinutes: 5,
      required: true,
      reportOnly: true,
    },
    {
      id: "rollback-sla-disable-stabilize",
      metric: "disable-to-stabilize",
      targetMinutes: 15,
      required: true,
      reportOnly: true,
    },
    {
      id: "rollback-sla-tenant-recovery",
      metric: "tenant-recovery",
      targetMinutes: 30,
      required: true,
      reportOnly: true,
    },
    {
      id: "rollback-sla-operator-escalation",
      metric: "operator-escalation",
      targetMinutes: 10,
      required: true,
      reportOnly: true,
    },
  ]
}

export function evaluateRollbackSlaCoverage(
  checkpoints: RollbackSlaCheckpoint[] = buildRollbackSlaCheckpoints()
) {
  const required = checkpoints.filter((checkpoint) => checkpoint.required).length
  const strictTargets = checkpoints.filter((checkpoint) => checkpoint.targetMinutes <= 30).length

  return {
    score: Math.round(
      (required / checkpoints.length) * 55 + (strictTargets / checkpoints.length) * 35
    ),
    status: "ROLLBACK_SLA_DEFINED_REPORT_ONLY" as const,
    checkpointCount: checkpoints.length,
  }
}
