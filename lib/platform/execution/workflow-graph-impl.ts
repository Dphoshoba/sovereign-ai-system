import {
  DAGValidationResult,
  ExecutionPlan,
  ExecutionPlanStep,
  MAX_CYCLES_REPORTED,
  WorkflowDefinition,
  WorkflowGraphEngine,
} from "./workflow-graph";

export class WorkflowGraphError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowGraphError';
  }
}

enum VisitState {
  UNVISITED,
  VISITING,
  VISITED,
}

export class WorkflowGraphEngineImpl implements WorkflowGraphEngine {
  validate(definition: WorkflowDefinition): DAGValidationResult {
    const steps = definition.steps;
    const stepIds = new Set(steps.map((s) => s.stepId));

    // Empty workflow check
    if (steps.length === 0) {
      return {
        valid: false,
        cycles: [],
        missingDependencies: [],
        duplicateSteps: [],
        emptyWorkflow: true,
      };
    }

    // Duplicate step IDs
    const seen = new Set<string>();
    const duplicateSteps: string[] = [];
    for (const s of steps) {
      if (seen.has(s.stepId)) {
        duplicateSteps.push(s.stepId);
      }
      seen.add(s.stepId);
    }

    // Missing dependencies
    const missingDependencies: string[] = [];
    for (const s of steps) {
      for (const dep of s.dependsOn) {
        if (!stepIds.has(dep) && !missingDependencies.includes(dep)) {
          missingDependencies.push(dep);
        }
      }
    }

    // Cycle detection via DFS
    const adjacency = new Map<string, string[]>();
    for (const s of steps) {
      adjacency.set(s.stepId, [...s.dependsOn]);
    }

    const visitState = new Map<string, VisitState>();
    for (const id of stepIds) {
      visitState.set(id, VisitState.UNVISITED);
    }

    const path: string[] = [];
    const cycles: string[][] = [];

    function dfs(node: string): void {
      const state = visitState.get(node)!;
      if (state === VisitState.VISITING) {
        const cycleStart = path.indexOf(node);
        if (cycleStart >= 0) {
          const cycle = [...path.slice(cycleStart), node];
          if (cycles.length < MAX_CYCLES_REPORTED) {
            cycles.push(cycle);
          }
        }
        return;
      }
      if (state === VisitState.VISITED) return;

      visitState.set(node, VisitState.VISITING);
      path.push(node);

      const neighbors = adjacency.get(node) ?? [];
      for (const neighbor of neighbors) {
        if (stepIds.has(neighbor)) {
          dfs(neighbor);
        }
      }

      path.pop();
      visitState.set(node, VisitState.VISITED);
    }

    for (const id of stepIds) {
      if (visitState.get(id) === VisitState.UNVISITED) {
        dfs(id);
      }
    }

    const valid =
      cycles.length === 0 &&
      missingDependencies.length === 0 &&
      duplicateSteps.length === 0 &&
      !(steps.length === 0);

    return {
      valid,
      cycles,
      missingDependencies,
      duplicateSteps,
      emptyWorkflow: steps.length === 0,
    };
  }

  plan(definition: WorkflowDefinition): ExecutionPlan {
    const validation = this.validate(definition);
    if (!validation.valid) {
      const reasons: string[] = [];
      if (validation.cycles.length > 0) reasons.push('cycle detected');
      if (validation.missingDependencies.length > 0) reasons.push('missing dependencies');
      if (validation.duplicateSteps.length > 0) reasons.push('duplicate steps');
      if (validation.emptyWorkflow) reasons.push('empty workflow');
      throw new WorkflowGraphError(
        `Cannot plan invalid workflow: ${reasons.join(', ')}`,
      );
    }

    const steps = definition.steps;
    const stepMap = new Map(steps.map((s) => [s.stepId, s]));

    // Topological sort using Kahn's algorithm with level tracking
    const inDegree = new Map<string, number>();
    const depMap = new Map<string, string[]>(); // node → its dependents

    for (const s of steps) {
      inDegree.set(s.stepId, 0);
      depMap.set(s.stepId, []);
    }

    for (const s of steps) {
      for (const dep of s.dependsOn) {
        if (stepMap.has(dep)) {
          inDegree.set(s.stepId, (inDegree.get(s.stepId) ?? 0) + 1);
          const deps = depMap.get(dep) ?? [];
          deps.push(s.stepId);
          depMap.set(dep, deps);
        }
      }
    }

    // Kahn's algorithm — process by level
    const orderedSteps: ExecutionPlanStep[] = [];
    let currentLevel = 0;
    let queue: string[] = [];

    for (const [id, degree] of inDegree) {
      if (degree === 0) {
        queue.push(id);
      }
    }

    while (queue.length > 0) {
      const nextQueue: string[] = [];

      for (const stepId of queue) {
        const step = stepMap.get(stepId)!;
        orderedSteps.push({
          stepId: step.stepId,
          providerId: step.providerId,
          operation: step.operation,
          input: { ...step.input },
          dependsOn: [...step.dependsOn],
          level: currentLevel,
          timeoutMs: step.timeoutMs,
        });

        const dependents = depMap.get(stepId) ?? [];
        for (const depId of dependents) {
          const newDegree = (inDegree.get(depId) ?? 1) - 1;
          inDegree.set(depId, newDegree);
          if (newDegree === 0) {
            nextQueue.push(depId);
          }
        }
      }

      queue = nextQueue;
      currentLevel++;
    }

    return {
      workflowId: definition.workflowId,
      orderedSteps,
      totalSteps: orderedSteps.length,
      levels: currentLevel,
    };
  }
}
