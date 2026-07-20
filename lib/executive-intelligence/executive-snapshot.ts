import { WorkforcePlatform } from '../workforce/workforce-platform';
import { ExecutiveSnapshot, OfficeStatus } from './types';
import { collectExecutiveStatus } from './collectors/executive-collector';
import { collectResearchStatus } from './collectors/research-collector';
import { collectProductStatus } from './collectors/product-collector';
import { collectOperationsStatus } from './collectors/operations-collector';
import { collectKnowledgeStatus } from './collectors/knowledge-collector';

let snapshotCounter = 0;

export function buildSnapshot(workforce: WorkforcePlatform): ExecutiveSnapshot {
  snapshotCounter++;
  const collectors = [
    collectExecutiveStatus,
    collectResearchStatus,
    collectProductStatus,
    collectOperationsStatus,
    collectKnowledgeStatus,
  ];

  const offices: Record<string, OfficeStatus> = {};

  for (const collect of collectors) {
    const status = collect(workforce);
    const agents = workforce.listAgentsByOffice(status.office);
    for (const agent of agents) {
      const tasks = workforce.getAgentTasks(agent.agentId);
      for (const task of tasks) {
        if (task.status === 'blocked') {
          status.blockers.push(`${task.summary} (${task.taskId})`);
        }
      }
    }
    offices[status.office] = status;
  }

  return {
    snapshotId: `snap-${snapshotCounter}`,
    timestamp: Date.now(),
    offices,
    pendingDecisions: [],
    escalatedRisks: [],
  };
}
