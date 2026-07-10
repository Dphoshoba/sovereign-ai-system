/**
 * Workflow Validator - Main validation orchestrator
 * 
 * Validates complete workflows for safety, structure, and readiness
 */

import type {
  WorkflowDefinition,
  ValidationError,
  ValidationWarning,
  WorkflowValidationResult,
  WorkflowMetrics,
} from '../../src/lib/gamma-flow/types';
import { validateWorkflowSchema } from './dependency-validator';
import { detectCycles } from './cycle-detector';
import { validateConnectorBindings } from './connector-binding-validator';
import { validateSafety } from './safety-validator';

export function validateWorkflow(definition: WorkflowDefinition): WorkflowValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let safetyScore = 100;
  let readinessScore = 100;
  let connectorCoverage = 0;
  let approvalCoverage = 0;

  // Null check
  if (!definition || !definition.steps || !definition.edges || !definition.trigger) {
    return {
      valid: false,
      errors: [{
        code: 'INVALID_DEFINITION',
        message: 'Workflow definition is null, undefined, or missing required fields',
        severity: 'critical',
      }],
      warnings,
      safetyScore: 0,
      readinessScore: 0,
      connectorCoverage: 0,
      approvalCoverage: 0,
    };
  }

  // 1. Schema validation
  const schemaErrors = validateWorkflowSchema(definition);
  errors.push(...schemaErrors);

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      warnings,
      safetyScore: 0,
      readinessScore: 0,
      connectorCoverage: 0,
      approvalCoverage: 0,
    };
  }

  // 2. Cycle detection
  const cycles = detectCycles(definition);
  if (cycles.length > 0) {
    errors.push({
      code: 'UNSAFE_CYCLE',
      message: `Workflow contains ${cycles.length} unsafe cycle(s)`,
      severity: 'critical',
    });
    safetyScore -= 25;
  }

  // 3. Connector binding validation
  const connectorErrors = validateConnectorBindings(definition);
  errors.push(...connectorErrors.errors);
  warnings.push(...connectorErrors.warnings);
  connectorCoverage = connectorErrors.coverage;

  if (connectorErrors.coverage < 100) {
    readinessScore -= 10;
  }

  // 4. Safety validation
  const safetyResult = validateSafety(definition);
  errors.push(...safetyResult.errors);
  warnings.push(...safetyResult.warnings);
  safetyScore = Math.max(0, safetyScore - safetyResult.riskDeduction);
  approvalCoverage = safetyResult.approvalCoverage;

  if (!safetyResult.hasApprovalBeforeMutation) {
    errors.push({
      code: 'NO_APPROVAL_BEFORE_MUTATION',
      message: 'Connectors that modify data must require approval',
      severity: 'critical',
    });
    safetyScore -= 25;
  }

  if (!safetyResult.hasQueueBeforeExecution) {
    errors.push({
      code: 'NO_QUEUE_BEFORE_EXECUTION',
      message: 'All execution paths must pass through queue',
      severity: 'critical',
    });
    safetyScore -= 25;
  }

  // 5. Calculate metrics
  const metrics: WorkflowMetrics = {
    nodeCount: definition.steps.length,
    edgeCount: definition.edges.length,
    connectorCount: new Set(
      definition.steps
        .filter(s => s.connectorName)
        .map(s => s.connectorName)
    ).size,
    approvalPointCount: definition.steps.filter(s => s.type === 'approval').length,
    queuePointCount: definition.steps.filter(s => s.type === 'queue').length,
    cycleCount: cycles.length,
    orphanNodeCount: countOrphanNodes(definition),
  };

  if (metrics.orphanNodeCount > 0) {
    warnings.push({
      code: 'ORPHAN_NODES',
      message: `Workflow has ${metrics.orphanNodeCount} unreachable nodes`,
      suggestion: 'Remove or connect orphaned nodes',
    });
    readinessScore -= 5;
  }

  readinessScore = Math.max(0, readinessScore);
  safetyScore = Math.max(0, safetyScore);

  return {
    valid: errors.length === 0 && safetyScore >= 50,
    errors,
    warnings,
    safetyScore,
    readinessScore,
    connectorCoverage,
    approvalCoverage,
    metrics,
  };
}

function countOrphanNodes(definition: WorkflowDefinition): number {
  const stepIds = new Set(definition.steps.map(s => s.id));
  const reachable = new Set<string>();

  // Find first step (connected from trigger)
  const triggerConnected = definition.edges
    .filter(e => e.from === definition.trigger.id)
    .map(e => e.to);

  const queue = [...triggerConnected];
  while (queue.length > 0) {
    const stepId = queue.shift()!;
    if (reachable.has(stepId)) continue;
    reachable.add(stepId);

    const nextSteps = definition.edges
      .filter(e => e.from === stepId)
      .map(e => e.to);
    queue.push(...nextSteps);
  }

  return stepIds.size - reachable.size;
}

export type { WorkflowValidationResult };
