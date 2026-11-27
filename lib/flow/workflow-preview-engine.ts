/**
 * Workflow Preview Engine
 * 
 * Executes workflows in preview mode with mock connector calls
 */

import type { WorkflowDefinition } from '../../src/lib/gamma-flow/types';
import { buildExecutionPlan, type ExecutionPlan, type ExecutionContext } from './execution-plan-builder';

export interface PreviewResult {
  success: boolean;
  executionId: string;
  context: ExecutionContext;
  stepResults: Record<string, StepResult>;
  approvalCheckpoints: ApprovalCheckpointPreview[];
  errors: string[];
}

export interface StepResult {
  stepId: string;
  duration: number;
  output?: any;
  error?: string;
  skipped: boolean;
}

export interface ApprovalCheckpointPreview {
  stepId: string;
  requiredApproval: boolean;
  suggestedApprovers: string[];
}

const MOCK_CONNECTOR_OUTPUTS: Record<string, any> = {
  gmail_read_message: {
    id: 'msg_123',
    subject: 'Test Email',
    body: 'This is a test email for preview',
    from: 'test@example.com',
  },
  gmail_create_draft: {
    id: 'draft_456',
    threadId: 'thread_123',
    subject: 'Draft Subject',
  },
  slack_send_message: {
    ts: '1234567890.123456',
    channel: 'C123456',
    ok: true,
  },
  github_create_issue: {
    id: 'issue_789',
    number: 123,
    title: 'Test Issue',
    state: 'open',
  },
};

export async function previewWorkflow(
  definition: WorkflowDefinition,
  executionId: string
): Promise<PreviewResult> {
  const plan = buildExecutionPlan(definition, executionId);
  const stepResults: Record<string, StepResult> = {};
  const approvalCheckpoints: ApprovalCheckpointPreview[] = [];
  const errors: string[] = [];

  try {
    // Execute each step in order
    for (const step of plan.compiled.steps) {
      const startTime = performance.now();

      try {
        // Run preprocessor
        const preprocessor = plan.preprocessors.get(step.stepId);
        if (preprocessor) {
          await preprocessor(plan.context);
        }

        plan.context.stepStates[step.stepId] = 'running';

        // Execute step based on type
        switch (step.stepType) {
          case 'trigger':
            // Trigger just marks as completed
            plan.context.stepOutputs[step.stepId] = { triggered: true };
            break;

          case 'connector':
            // Mock connector execution
            const mockKey = `${step.connectorName}_${step.actionId}`;
            const mockOutput = MOCK_CONNECTOR_OUTPUTS[mockKey] || { success: true, mocked: true };
            plan.context.stepOutputs[step.stepId] = mockOutput;
            break;

          case 'decision':
            // Mock decision: route to both paths
            plan.context.stepOutputs[step.stepId] = { decision: 'true', condition: true };
            break;

          case 'approval':
            // Track approval checkpoint for preview
            approvalCheckpoints.push({
              stepId: step.stepId,
              requiredApproval: true,
              suggestedApprovers: ['admin@example.com'],
            });
            // Auto-approve in preview
            plan.context.approvalDecisions[step.stepId] = true;
            plan.context.stepOutputs[step.stepId] = { approved: true };
            break;

          case 'queue':
            // Queue step just marks item as queued
            plan.context.queuedItems.push(step.stepId);
            plan.context.stepOutputs[step.stepId] = { queued: true, queueSize: plan.context.queuedItems.length };
            break;

          case 'transform':
            // Transform just passes through
            plan.context.stepOutputs[step.stepId] = { transformed: true };
            break;

          case 'delay':
            // In preview, don't actually delay
            plan.context.stepOutputs[step.stepId] = { delayed: true };
            break;

          case 'notification':
            // Mock notification
            plan.context.stepOutputs[step.stepId] = { notified: true, channels: [] };
            break;

          case 'sink':
            // Sink marks end of execution
            plan.context.stepOutputs[step.stepId] = { execution_complete: true };
            break;

          default:
            errors.push(`Unknown step type: ${step.stepType}`);
        }

        // Run postprocessor
        const postprocessor = plan.postprocessors.get(step.stepId);
        if (postprocessor) {
          await postprocessor(plan.context);
        }

        const duration = performance.now() - startTime;
        stepResults[step.stepId] = {
          stepId: step.stepId,
          duration,
          output: plan.context.stepOutputs[step.stepId],
          skipped: false,
        };
      } catch (error) {
        const duration = performance.now() - startTime;
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Step ${step.stepId} failed: ${errorMsg}`);

        stepResults[step.stepId] = {
          stepId: step.stepId,
          duration,
          error: errorMsg,
          skipped: false,
        };

        plan.context.stepStates[step.stepId] = 'failed';
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(`Preview execution failed: ${errorMsg}`);
  }

  return {
    success: errors.length === 0,
    executionId,
    context: plan.context,
    stepResults,
    approvalCheckpoints,
    errors,
  };
}

export async function previewWorkflowWithInputs(
  definition: WorkflowDefinition,
  executionId: string,
  inputs: Record<string, any>
): Promise<PreviewResult> {
  // Inject initial inputs into trigger
  const modifiedDef = {
    ...definition,
    trigger: {
      ...definition.trigger,
      outputMapping: inputs,
    },
  };

  return previewWorkflow(modifiedDef, executionId);
}
