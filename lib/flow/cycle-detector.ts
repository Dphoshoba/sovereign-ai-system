/**
 * Cycle Detector
 * 
 * Detects unsafe cycles in workflow graphs
 */

import type { WorkflowDefinition } from '../../src/lib/gamma-flow/types';

export interface Cycle {
  nodeIds: string[];
  length: number;
}

export function detectCycles(definition: WorkflowDefinition): Cycle[] {
  const cycles: Cycle[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string, path: string[]): void {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const nextNodes = definition.edges
      .filter((e: any) => e.from === nodeId)
      .map((e: any) => e.to);

    for (const nextId of nextNodes) {
      if (!visited.has(nextId)) {
        dfs(nextId, [...path]);
      } else if (recursionStack.has(nextId)) {
        // Found a cycle
        const cycleStart = path.indexOf(nextId);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart);
          if (!cycles.some(c => cyclesEqual(c.nodeIds, cycle))) {
            cycles.push({
              nodeIds: cycle,
              length: cycle.length,
            });
          }
        }
      }
    }

    recursionStack.delete(nodeId);
  }

  // Start DFS from trigger
  dfs(definition.trigger.id, []);

  return cycles;
}

function cyclesEqual(cycle1: string[], cycle2: string[]): boolean {
  if (cycle1.length !== cycle2.length) return false;
  const sorted1 = [...cycle1].sort();
  const sorted2 = [...cycle2].sort();
  return sorted1.every((id, i) => id === sorted2[i]);
}
