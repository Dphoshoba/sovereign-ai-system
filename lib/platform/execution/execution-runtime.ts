import { ExecutionContext, ExecutionContextManager } from "./execution-context";
import { RuntimeResult } from "./runtime-result";
import { RuntimeState } from "./runtime-state-machine";
import { StateMachine } from "./state-machine";
import { SafetyGauntlet } from "./safety-gauntlet";
import { AuditRecordBuilder } from "./audit-record-builder";
import { ExecutionFailureCode } from "./failure-classifier";
import { ConnectorRuntimeRegistry } from "./connector-runtime-registry";
import { RuntimeSnapshot } from "./capabilities";
import { QueueValidator } from "../queue/queue-validator";

/**
 * Represents a single a-temporal step in the deterministic execution pipeline.
 */
interface PipelineStep {
  name: string;
  execute: (ctx: ExecutionContext, sm: StateMachine) => { success: boolean; failureCode?: ExecutionFailureCode; nextContext: ExecutionContext };
}

export class ExecutionRuntime {
  private static PIPELINE: PipelineStep[] = [
    {
      name: 'Package Validation',
      execute: (ctx, sm) => {
        sm.transitionTo('VALIDATING_PACKAGE');
        const nextCtx = { ...ctx, auditLog: [...ctx.auditLog, `State: VALIDATING_PACKAGE`] };
        return QueueValidator.validate(ctx.candidate).valid
          ? { success: true, nextContext: nextCtx }
          : { success: false, failureCode: ExecutionFailureCode.QUEUE_INVALID, nextContext: nextCtx };
      }
    },
    {
      name: 'Capability Resolution',
      execute: (ctx, sm) => {
        sm.transitionTo('LOCK_VALIDATION');
        const nextCtx = { ...ctx, auditLog: [...ctx.auditLog, `State: LOCK_VALIDATION`] };
        if (!ConnectorRuntimeRegistry.getRuntime(ctx.candidate.connectorId)) {
          return { success: false, failureCode: ExecutionFailureCode.CONNECTOR_NOT_REGISTERED, nextContext: nextCtx };
        }
        return { success: true, nextContext: nextCtx };
      }
    },
    {
      name: 'Safety Gauntlet',
      execute: (ctx, sm) => {
        sm.transitionTo('PREPARING');
        let log = [...ctx.auditLog, `State: PREPARING` ];

        sm.transitionTo('PREFLIGHT');
        log.push(`State: PREFLIGHT`);

        sm.transitionTo('READY');
        log.push(`State: READY`);

        const failureCode = SafetyGauntlet.check(
          ctx.candidate,
          ctx.decision,
          ctx.capabilities,
        );

        if (failureCode) {
          sm.transitionTo('EXECUTION_BLOCKED');
          return {
            success: true,
            failureCode,
            nextContext: {
              ...ctx,
              auditLog: [
                ...log,
                'State: EXECUTION_BLOCKED',
                `S3A_EXECUTION_BLOCKED: ${failureCode}`,
              ],
            },
          };
        }
        return { success: true, nextContext: { ...ctx, auditLog: log } };
      }
    },
    {
      name: 'State Transition',
      execute: (ctx, sm) => {
        if (sm.getState() !== 'EXECUTION_BLOCKED') {
          return { success: false, failureCode: ExecutionFailureCode.S3A_EXECUTION_BLOCKED, nextContext: ctx };
        }
        return { success: true, nextContext: ctx };
      }
    },
    {
      name: 'Audit Projection',
      execute: (ctx, sm) => {
        sm.transitionTo('AUDITING');
        const nextCtx = { ...ctx, auditLog: [...ctx.auditLog, `State: AUDITING`] };
        return { success: true, nextContext: nextCtx };
      }
    }
  ];

  static async run(initialContext: ExecutionContext): Promise<RuntimeResult> {
    const sm = new StateMachine();
    const snapshots: RuntimeSnapshot[] = [];
    let currentContext = ExecutionContextManager.clone(initialContext);
    let currentStepIndex = 0;
    let finalFailureCode: ExecutionFailureCode | undefined;

    try {
      while (currentStepIndex < this.PIPELINE.length) {
        const step = this.PIPELINE[currentStepIndex];

        // Produce a snapshot BEFORE the step executes
        snapshots.push(ExecutionContextManager.createSnapshot(currentContext, currentStepIndex, step.name));

        const result = step.execute(currentContext, sm);

        if (!result.success) {
          finalFailureCode = result.failureCode;
          sm.transitionTo('FAILED');
          currentContext = result.nextContext;
          break;
        }

        if (result.failureCode) {
          finalFailureCode = result.failureCode;
        }

        currentContext = result.nextContext;
        currentStepIndex++;
      }

      if (sm.getState() !== 'FAILED') {
        sm.transitionTo('COMPLETED');
      }

    } catch (e: any) {
      finalFailureCode = ExecutionFailureCode.S3A_EXECUTION_BLOCKED;
      sm.transitionTo('FAILED');
    }

    const auditRecord = AuditRecordBuilder.build(currentContext, sm.getState(), finalFailureCode);

    return {
      status: finalFailureCode ? 'FAILED' : 'SUCCESS',
      finalState: sm.getState(),
      failureClassification: finalFailureCode,
      transitionHistory: currentContext.auditLog,
      auditProjection: auditRecord,
      executionAttempted: false,
      providerMutationAttempted: false,
      providerMutationCompleted: false,
      deterministicHashes: {
        inputHash: `in-${currentContext.candidate.queueId}`,
        outputHash: `out-${auditRecord.auditId}`,
        pipelineHash: `pipe-${snapshots.map(s => s.snapshotHash).join('-')}`,
      },
      warnings: [],
      blockingReasons: finalFailureCode ? [finalFailureCode] : [],
    };
  }
}
