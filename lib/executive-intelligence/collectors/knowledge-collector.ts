import { WorkforcePlatform } from '../../workforce/workforce-platform';
import { OfficeStatus } from '../types';

export function collectKnowledgeStatus(workforce: WorkforcePlatform): OfficeStatus {
  const agents = workforce.listAgentsByOffice('Knowledge Office');
  return {
    office: 'Knowledge Office',
    health: agents.length === 4 ? 'healthy' : 'attention',
    agentCount: agents.length,
    activeTasks: agents.reduce((sum, a) => sum + workforce.getAgentTasks(a.agentId).length, 0),
    blockers: [],
    recentChanges: [],
  };
}
