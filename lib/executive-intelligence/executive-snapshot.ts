import { WorkforcePlatform } from '../workforce/workforce-platform';
import { ExecutiveSnapshot, OfficeStatus, PendingDecision, CrossOfficeDependency } from './types';
import { collectExecutiveStatus } from './collectors/executive-collector';
import { collectResearchStatus } from './collectors/research-collector';
import { collectProductStatus } from './collectors/product-collector';
import { collectOperationsStatus } from './collectors/operations-collector';
import { collectKnowledgeStatus } from './collectors/knowledge-collector';

let snapshotCounter = 0;

const OFFICE_NAMES = ['Executive Office', 'Research Office', 'Product Office', 'Operations Office', 'Knowledge Office'];

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

  const pendingDecisions = collectPendingDecisions(workforce);
  const crossOfficeDependencies = detectCrossOfficeDependencies(offices);

  return {
    snapshotId: `snap-${snapshotCounter}`,
    timestamp: Date.now(),
    offices,
    pendingDecisions,
    escalatedRisks: [],
    crossOfficeDependencies,
  };
}

function collectPendingDecisions(workforce: WorkforcePlatform): PendingDecision[] {
  const reviews = workforce.getPendingHumanReviews();
  return reviews.map((r, i) => ({
    id: `decision-${i + 1}`,
    office: resolveOfficeForAgent(r.agentId),
    actionType: r.actionType,
    requestedAt: r.requestedAt,
    urgency: r.mode === 'stop' ? 'critical' : r.mode === 'recommend' ? 'high' : 'medium',
    summary: r.actionType,
    requiredApprover: r.resolvedBy || 'Not assigned',
    rationale: typeof r.context === 'object' && r.context !== null ? JSON.stringify(r.context) : String(r.context || ''),
    status: r.resolution ? (r.resolution as PendingDecision['status']) : 'pending',
  }));
}

function resolveOfficeForAgent(agentId: string): string {
  if (agentId.startsWith('EXEC')) return 'Executive Office';
  if (agentId.startsWith('RES')) return 'Research Office';
  if (agentId.startsWith('PROD')) return 'Product Office';
  if (agentId.startsWith('OPS')) return 'Operations Office';
  if (agentId.startsWith('KNOW')) return 'Knowledge Office';
  return 'Unknown';
}

function detectCrossOfficeDependencies(offices: Record<string, OfficeStatus>): CrossOfficeDependency[] {
  const deps: CrossOfficeDependency[] = [];
  let depId = 0;

  for (const [office, status] of Object.entries(offices)) {
    for (const blocker of status.blockers) {
      for (const target of OFFICE_NAMES) {
        if (target !== office && blocker.toLowerCase().includes(target.toLowerCase().replace(' office', ''))) {
          depId++;
          deps.push({
            id: `dep-${depId}`,
            sourceOffice: office,
            targetOffice: target,
            description: blocker,
            status: 'blocked',
          });
        }
      }
    }
  }

  return deps;
}
