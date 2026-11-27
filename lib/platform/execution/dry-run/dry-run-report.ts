import { DryRunReport, DryRunArtifacts, DryRunOutcome } from './dry-run-types';

export function computeExecutionHash(artifacts: DryRunArtifacts): string {
  const serialized = JSON.stringify({
    mutationPlan: artifacts.mutationPlan,
    idempotencyKey: artifacts.idempotencyKey,
    approval: artifacts.approvalVerdict?.decision ?? 'none',
    rollbackPlanHash: artifacts.rollbackPlan?.planHash ?? 'none',
    verificationOperation: artifacts.verificationPlan.operation,
    auditCount: artifacts.auditEvents.length,
  });
  let hash = 0;
  for (let i = 0; i < serialized.length; i++) {
    hash = ((hash << 5) - hash) + serialized.charCodeAt(i);
    hash |= 0;
  }
  return `dryrun-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

export class DryRunReportBuilder {
  build(
    executionId: string,
    operation: string,
    artifacts: DryRunArtifacts,
    transportInvoked: boolean,
    warnings: string[],
  ): DryRunReport {
    const allPhasesPassed = artifacts.phaseResults.every(p => p.passed);
    const outcome: DryRunOutcome = transportInvoked
      ? 'DRY_RUN_INCOMPLETE'
      : allPhasesPassed
        ? 'DRY_RUN_PASSED'
        : 'DRY_RUN_FAILED';

    const executionHash = computeExecutionHash(artifacts);

    if (transportInvoked) {
      warnings.push('TRANSPORT_INVOKED');
    }

    return {
      executionId,
      operation,
      outcome,
      artifacts,
      executionHash,
      transportInvoked,
      phasesCompleted: artifacts.phaseResults.map(p => p.phase),
      generatedAt: '2026-01-01T00:00:00Z',
      warnings,
    };
  }
}
