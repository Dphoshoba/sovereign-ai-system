/**
 * Workflow Compiler
 * 
 * Compiles validated workflow definitions into ordered execution plans
 */

import type { WorkflowDefinition, WorkflowStep } from '../../src/lib/gamma-flow/types';

export interface ExecutionStep {
  stepId: string;
  order: number;
  stepType: string;
  connectorName?: string;
  actionId?: string;
  dependencies: string[];
  inputs?: Record<string, any>;
  outputKey?: string;
  isAsync: boolean;
  timeout?: number;
}

export interface CompiledWorkflow {
  id: string;
  steps: ExecutionStep[];
  edges: Map<string, string[]>; // stepId -> [nextStepIds]
  criticalPath: string[]; // longest dependency chain
  executionTimeEstimate: number; // milliseconds
  parallelizable: boolean;
}

export function compileWorkflow(definition: WorkflowDefinition): CompiledWorkflow {
  // Null check
  if (!definition || !definition.steps || !definition.edges) {
    return {
      id: 'empty',
      steps: [],
      edges: new Map(),
      criticalPath: [],
      executionTimeEstimate: 0,
      parallelizable: false,
    };
  }

  // 1. Topological sort to establish execution order
  const sortedSteps = topologicalSort(definition);

  // 2. Build execution steps with dependencies
  const executionSteps: ExecutionStep[] = sortedSteps.map((stepId, index) => {
    const step = definition.steps.find(s => s.id === stepId);
    if (!step) {
      return {
        stepId,
        order: index,
        stepType: 'unknown',
        connectorName: undefined,
        actionId: undefined,
        dependencies: [],
        inputs: {},
        outputKey: `step_${stepId}`,
        isAsync: false,
        timeout: 300000,
      };
    }
    
    const dependencies = definition.edges
      .filter(e => e.to === stepId)
      .map(e => e.from)
      .filter(id => id !== definition.trigger?.id);

    return {
      stepId: step.id,
      order: index,
      stepType: step.type,
      connectorName: 'connectorName' in step ? step.connectorName : undefined,
      actionId: 'actionId' in step ? step.actionId : undefined,
      dependencies,
      inputs: 'inputMapping' in step ? step.inputMapping : {},
      outputKey: `step_${step.id}`,
      isAsync: step.type === 'connector' || step.type === 'approval',
      timeout: step.type === 'approval' ? 3600000 : 300000,
    };
  });

  // 3. Build edges map
  const edgesMap = new Map<string, string[]>();
  for (const step of executionSteps) {
    const nextSteps = definition.edges
      .filter(e => e.from === step.stepId)
      .map(e => e.to);
    if (nextSteps.length > 0) {
      edgesMap.set(step.stepId, nextSteps);
    }
  }

  // 4. Calculate critical path
  const criticalPath = findCriticalPath(executionSteps);

  // 5. Estimate execution time
  const timeEstimate = estimateExecutionTime(executionSteps, definition);

  // 6. Check parallelizability
  const isParallelizable = checkParallelizability(executionSteps);

  return {
    id: definition.id,
    steps: executionSteps,
    edges: edgesMap,
    criticalPath,
    executionTimeEstimate: timeEstimate,
    parallelizable: isParallelizable,
  };
}

function topologicalSort(definition: WorkflowDefinition): string[] {
  const sorted: string[] = [];
  const visited = new Set<string>();
  const tempMark = new Set<string>();

  function visit(nodeId: string): void {
    if (visited.has(nodeId)) return;
    if (tempMark.has(nodeId)) return; // cycle detected, skip

    tempMark.add(nodeId);

    const nextNodes = definition.edges
      .filter(e => e.from === nodeId)
      .map(e => e.to);

    for (const nextId of nextNodes) {
      visit(nextId);
    }

    tempMark.delete(nodeId);
    visited.add(nodeId);
    sorted.push(nodeId);
  }

  // Start from trigger
  visit(definition.trigger.id);

  return sorted;
}

function findCriticalPath(steps: ExecutionStep[]): string[] {
  // Simple implementation: longest dependency chain
  const pathLengths = new Map<string, number>();
  const paths = new Map<string, string[]>();

  for (const step of steps) {
    if (step.dependencies.length === 0) {
      pathLengths.set(step.stepId, 1);
      paths.set(step.stepId, [step.stepId]);
    } else {
      let maxLength = 0;
      let longestPath: string[] = [];

      for (const dep of step.dependencies) {
        const depLength = pathLengths.get(dep) || 1;
        if (depLength > maxLength) {
          maxLength = depLength;
          longestPath = [...(paths.get(dep) || [])];
        }
      }

      pathLengths.set(step.stepId, maxLength + 1);
      paths.set(step.stepId, [...longestPath, step.stepId]);
    }
  }

  // Return longest path
  let longest: string[] = [];
  for (const path of paths.values()) {
    if (path.length > longest.length) {
      longest = path;
    }
  }

  return longest;
}

function estimateExecutionTime(steps: ExecutionStep[], definition: WorkflowDefinition): number {
  let totalTime = 0;

  for (const step of steps) {
    if (step.stepType === 'connector') {
      totalTime += 2000; // 2s per connector call
    } else if (step.stepType === 'approval') {
      totalTime += 300000; // 5min default for approval
    } else if (step.stepType === 'decision' || step.stepType === 'transform') {
      totalTime += 500; // 500ms for logic
    } else if (step.stepType === 'delay') {
      // Check if delay duration is specified
      totalTime += 5000; // 5s default
    }
  }

  return totalTime;
}

function checkParallelizability(steps: ExecutionStep[]): boolean {
  // Check if there are multiple independent branches
  let independentBranches = 0;

  for (const step of steps) {
    if (step.dependencies.length === 0) {
      independentBranches++;
    }
  }

  return independentBranches > 1;
}
