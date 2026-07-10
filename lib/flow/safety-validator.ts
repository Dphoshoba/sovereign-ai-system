/**
 * Safety Validator
 * 
 * Validates safety guarantees: approval before mutation, queue before execution, audit
 */

import type { WorkflowDefinition, ValidationError, ValidationWarning } from '../../src/lib/gamma-flow/types';

export interface SafetyValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  hasApprovalBeforeMutation: boolean;
  hasQueueBeforeExecution: boolean;
  approvalCoverage: number; // 0-100
  riskDeduction: number; // 0-100
}

const MUTATING_ACTIONS = new Set([
  'create_draft',
  'send',
  'send_message',
  'post_to_channel',
  'create_issue',
  'create_page',
  'update_page',
  'upload',
]);

export function validateSafety(definition: WorkflowDefinition): SafetyValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let riskDeduction = 0;

  // 1. Check approval before all mutating actions
  let hasApprovalBeforeMutation = true;
  for (const step of definition.steps) {
    if (step.type === 'connector' && isMutatingAction(step)) {
      if (!step.requiresApproval) {
        errors.push({
          code: 'NO_APPROVAL_FOR_MUTATION',
          message: `Mutating action '${step.actionId}' requires approval`,
          location: step.id,
          severity: 'critical',
        });
        hasApprovalBeforeMutation = false;
        riskDeduction += 15;
      }

      // Check approval in path
      const pathsToStep = findPathsTo(definition, step.id);
      const hasApprovalInPath = pathsToStep.some(path =>
        path.some(nodeId => definition.steps.some(s => s.id === nodeId && s.type === 'approval'))
      );

      if (!hasApprovalInPath) {
        warnings.push({
          code: 'MUTATION_NOT_GATED',
          message: `Mutating action '${step.actionId}' may not be reachable through approval`,
          location: step.id,
        });
        riskDeduction += 10;
      }
    }
  }

  // 2. Check queue before execution endpoints
  let hasQueueBeforeExecution = true;
  const sinkSteps = definition.steps.filter(s => s.type === 'sink');
  for (const sink of sinkSteps) {
    const pathsToSink = findPathsTo(definition, sink.id);
    const allPathsHaveQueue = pathsToSink.every(path =>
      path.some(nodeId => definition.steps.some(s => s.id === nodeId && s.type === 'queue'))
    );

    if (!allPathsHaveQueue) {
      errors.push({
        code: 'NO_QUEUE_BEFORE_SINK',
        message: 'Not all paths to execution completion pass through queue',
        location: sink.id,
        severity: 'critical',
      });
      hasQueueBeforeExecution = false;
      riskDeduction += 20;
    }
  }

  // 3. Check audit is enabled
  if (!definition.enableAudit) {
    warnings.push({
      code: 'AUDIT_DISABLED',
      message: 'Audit is disabled; cannot track execution',
    });
    riskDeduction += 5;
  }

  // 4. Calculate approval coverage
  const totalSteps = definition.steps.filter(s => s.type !== 'sink').length;
  const approvalSteps = definition.steps.filter(s => s.type === 'approval').length;
  const approvalCoverage = totalSteps > 0 ? Math.round((approvalSteps / totalSteps) * 100) : 0;

  if (approvalCoverage < 25) {
    warnings.push({
      code: 'LOW_APPROVAL_COVERAGE',
      message: `Only ${approvalCoverage}% of steps have approval gates`,
      suggestion: 'Add approval steps for critical operations',
    });
    riskDeduction += 10;
  }

  // 5. Check preview mode default
  if (definition.previewMode === false) {
    warnings.push({
      code: 'PREVIEW_MODE_DISABLED',
      message: 'Workflow does not run in preview mode',
    });
    riskDeduction += 15;
  }

  return {
    errors,
    warnings,
    hasApprovalBeforeMutation,
    hasQueueBeforeExecution,
    approvalCoverage,
    riskDeduction: Math.min(100, riskDeduction),
  };
}

function isMutatingAction(step: any): boolean {
  return MUTATING_ACTIONS.has(step.actionId || '');
}

function findPathsTo(definition: WorkflowDefinition, targetId: string): string[][] {
  const paths: string[][] = [];
  const visited = new Set<string>();

  function dfs(currentId: string, path: string[]): void {
    if (currentId === targetId) {
      paths.push([...path, currentId]);
      return;
    }

    if (visited.has(currentId)) return;
    visited.add(currentId);

    const nextNodes = definition.edges
      .filter(e => e.from === currentId)
      .map(e => e.to);

    for (const nextId of nextNodes) {
      dfs(nextId, [...path, currentId]);
    }

    visited.delete(currentId);
  }

  // Start from trigger
  dfs(definition.trigger.id, []);

  return paths;
}
