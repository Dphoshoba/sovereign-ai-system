/**
 * Dependency Validator
 * 
 * Validates workflow structure and dependencies
 */

import type { WorkflowDefinition, ValidationError } from '../../src/lib/gamma-flow/types';

export function validateWorkflowSchema(definition: WorkflowDefinition): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check unique node IDs
  const stepIds = definition.steps.map((s: any) => s.id);
  const uniqueIds = new Set(stepIds);
  if (stepIds.length !== uniqueIds.size) {
    errors.push({
      code: 'DUPLICATE_STEP_IDS',
      message: 'Workflow contains duplicate step IDs',
      severity: 'critical',
    });
  }

  // Check unique edge IDs
  const edgeIds = definition.edges.map((e: any) => e.id);
  const uniqueEdges = new Set(edgeIds);
  if (edgeIds.length !== uniqueEdges.size) {
    errors.push({
      code: 'DUPLICATE_EDGE_IDS',
      message: 'Workflow contains duplicate edge IDs',
      severity: 'critical',
    });
  }

  // Check valid start node (trigger must have at least one outgoing edge)
  const triggerEdges = definition.edges.filter((e: any) => e.from === definition.trigger.id);
  if (triggerEdges.length === 0) {
    errors.push({
      code: 'NO_START_NODE',
      message: 'Trigger has no outgoing edges',
      severity: 'critical',
    });
  }

  // Check at least one terminal node (sink)
  const sinkSteps = definition.steps.filter((s: any) => s.type === 'sink');
  if (sinkSteps.length === 0) {
    errors.push({
      code: 'NO_TERMINAL_NODE',
      message: 'Workflow must have at least one sink/terminal node',
      severity: 'critical',
    });
  }

  // Check all edges reference valid nodes
  const validNodeIds = new Set([definition.trigger.id, ...stepIds]);
  for (const edge of definition.edges) {
    if (!validNodeIds.has(edge.from)) {
      errors.push({
        code: 'INVALID_EDGE_SOURCE',
        message: `Edge ${edge.id} references non-existent source ${edge.from}`,
        location: edge.id,
        severity: 'critical',
      });
    }
    if (!validNodeIds.has(edge.to)) {
      errors.push({
        code: 'INVALID_EDGE_TARGET',
        message: `Edge ${edge.id} references non-existent target ${edge.to}`,
        location: edge.id,
        severity: 'critical',
      });
    }
  }

  // Check no missing references in input mapping
  for (const step of definition.steps) {
    if (step.inputMapping) {
      for (const [key, path] of Object.entries(step.inputMapping)) {
        if (typeof path === 'string' && path.startsWith('$.')) {
          // Path reference validation - ensure source step exists
          const sourceStepId = extractStepIdFromPath(path);
          if (sourceStepId && !stepIds.includes(sourceStepId)) {
            errors.push({
              code: 'INVALID_INPUT_REFERENCE',
              message: `Step ${step.id} references non-existent step in ${path}`,
              location: step.id,
              severity: 'error',
            });
          }
        }
      }
    }
  }

  return errors;
}

function extractStepIdFromPath(path: string): string | null {
  // Simple extraction: $.step_name -> step_name
  const match = path.match(/^\$\.([a-z0-9_]+)/);
  return match ? match[1] : null;
}
