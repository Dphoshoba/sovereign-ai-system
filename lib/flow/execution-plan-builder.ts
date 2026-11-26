/**
 * Execution Plan Builder
 * 
 * Builds execution sequences with connector bindings and input/output context flow
 */

import type { WorkflowDefinition } from '../../src/lib/gamma-flow/types';
import { compileWorkflow, type CompiledWorkflow, type ExecutionStep } from './workflow-compiler';

export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  currentStepIndex: number;
  stepOutputs: Record<string, any>;
  stepStates: Record<string, 'pending' | 'running' | 'completed' | 'failed'>;
  approvalDecisions: Record<string, boolean>;
  queuedItems: string[];
  startTime: Date;
  lastUpdate: Date;
}

export interface BindingResolution {
  inputMappings: Record<string, any>;
  connectorConfig: Record<string, any>;
  authToken?: string;
}

export interface ExecutionPlan {
  workflowId: string;
  compiled: CompiledWorkflow;
  context: ExecutionContext;
  bindings: Map<string, BindingResolution>;
  preprocessors: Map<string, (context: ExecutionContext) => Promise<void>>;
  postprocessors: Map<string, (context: ExecutionContext) => Promise<void>>;
}

export function buildExecutionPlan(definition: WorkflowDefinition, executionId: string): ExecutionPlan {
  // 1. Compile workflow
  const compiled = compileWorkflow(definition);

  // 2. Initialize execution context
  const context: ExecutionContext = {
    workflowId: definition.id,
    executionId,
    currentStepIndex: 0,
    stepOutputs: {},
    stepStates: {},
    approvalDecisions: {},
    queuedItems: [],
    startTime: new Date(),
    lastUpdate: new Date(),
  };

  // Initialize step states
  for (const step of compiled.steps) {
    context.stepStates[step.stepId] = 'pending';
  }

  // 3. Resolve connector bindings
  const bindings = resolveConnectorBindings(definition, compiled);

  // 4. Create preprocessors for input resolution
  const preprocessors = buildPreprocessors(definition, compiled);

  // 5. Create postprocessors for output capture
  const postprocessors = buildPostprocessors(compiled);

  return {
    workflowId: definition.id,
    compiled,
    context,
    bindings,
    preprocessors,
    postprocessors,
  };
}

function resolveConnectorBindings(
  definition: WorkflowDefinition,
  compiled: CompiledWorkflow
): Map<string, BindingResolution> {
  const bindings = new Map<string, BindingResolution>();

  for (const step of compiled.steps) {
    if (step.stepType === 'connector' && step.connectorName) {
      const originalStep = definition.steps.find(s => s.id === step.stepId)!;
      const binding: BindingResolution = {
        inputMappings: originalStep.inputMapping || {},
        connectorConfig: {
          connectorName: step.connectorName,
          actionId: step.actionId,
        },
      };

      // In real implementation, would fetch auth token from vault
      if (step.connectorName === 'gmail') {
        binding.authToken = process.env.GMAIL_TOKEN;
      } else if (step.connectorName === 'slack') {
        binding.authToken = process.env.SLACK_TOKEN;
      }

      bindings.set(step.stepId, binding);
    }
  }

  return bindings;
}

function buildPreprocessors(
  definition: WorkflowDefinition,
  compiled: CompiledWorkflow
): Map<string, (context: ExecutionContext) => Promise<void>> {
  const preprocessors = new Map<string, (context: ExecutionContext) => Promise<void>>();

  for (const step of compiled.steps) {
    preprocessors.set(step.stepId, async (context: ExecutionContext) => {
      // Resolve input mappings from previous step outputs
      if (step.inputs) {
        const resolvedInputs: Record<string, any> = {};

        for (const [key, value] of Object.entries(step.inputs)) {
          if (typeof value === 'string' && value.startsWith('$.')) {
            // Reference to previous step output
            const [depStepId, path] = parseReference(value);
            if (depStepId && context.stepOutputs[depStepId]) {
              resolvedInputs[key] = getNestedValue(context.stepOutputs[depStepId], path);
            }
          } else {
            resolvedInputs[key] = value;
          }
        }

        // Store resolved inputs in context
        context.stepOutputs[`inputs_${step.stepId}`] = resolvedInputs;
      }
    });
  }

  return preprocessors;
}

function buildPostprocessors(
  compiled: CompiledWorkflow
): Map<string, (context: ExecutionContext) => Promise<void>> {
  const postprocessors = new Map<string, (context: ExecutionContext) => Promise<void>>();

  for (const step of compiled.steps) {
    postprocessors.set(step.stepId, async (context: ExecutionContext) => {
      // Capture step output
      context.stepOutputs[step.stepId] = {
        timestamp: new Date(),
        stepType: step.stepType,
      };

      // Update step state
      context.stepStates[step.stepId] = 'completed';
      context.lastUpdate = new Date();
    });
  }

  return postprocessors;
}

function parseReference(ref: string): [string | null, string] {
  // Parse $.step_name.field.nested -> [step_name, field.nested]
  const match = ref.match(/^\$\.([a-z0-9_]+)(\..*)?$/);
  if (match) {
    return [match[1], match[2] || ''];
  }
  return [null, ''];
}

function getNestedValue(obj: any, path: string): any {
  if (!path) return obj;

  const parts = path.split('.').filter(p => p.length > 0);
  let current = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  return current;
}
