import { buildCanaryCohorts } from "./canary-cohort"
import { buildOperatorApprovalGates } from "./operator-approval-gate"
import { buildRollbackSlaCheckpoints } from "./rollback-sla"

export type CutoverRehearsalCheckpoint = {
  id: string
  checkpoint: "precheck" | "canary-pass" | "sla-pass" | "approval-pass" | "scorecard-pass"
  required: boolean
  reportOnly: true
}

export function buildCutoverRehearsalCheckpoints(): CutoverRehearsalCheckpoint[] {
  return [
    {
      id: "cutover-rehearsal-precheck",
      checkpoint: "precheck",
      required: true,
      reportOnly: true,
    },
    {
      id: "cutover-rehearsal-canary-pass",
      checkpoint: "canary-pass",
      required: true,
      reportOnly: true,
    },
    {
      id: "cutover-rehearsal-sla-pass",
      checkpoint: "sla-pass",
      required: true,
      reportOnly: true,
    },
    {
      id: "cutover-rehearsal-approval-pass",
      checkpoint: "approval-pass",
      required: true,
      reportOnly: true,
    },
    {
      id: "cutover-rehearsal-scorecard-pass",
      checkpoint: "scorecard-pass",
      required: true,
      reportOnly: true,
    },
  ]
}

export function evaluateCutoverScorecardCoverage(
  checkpoints: CutoverRehearsalCheckpoint[] = buildCutoverRehearsalCheckpoints()
) {
  const required = checkpoints.filter((checkpoint) => checkpoint.required).length
  const canaries = buildCanaryCohorts()
  const slas = buildRollbackSlaCheckpoints()
  const approvals = buildOperatorApprovalGates()

  return {
    score: Math.round(
      (required / checkpoints.length) * 40 +
        (canaries.filter((cohort) => cohort.required).length / canaries.length) * 18 +
        (slas.filter((sla) => sla.required).length / slas.length) * 18 +
        (approvals.filter((gate) => gate.required).length / approvals.length) * 18
    ),
    status: "CUTOVER_SCORECARD_DEFINED_REPORT_ONLY" as const,
    checkpointCount: checkpoints.length,
  }
}
