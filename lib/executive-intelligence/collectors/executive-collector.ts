import { WorkforcePlatform } from '../../workforce/workforce-platform';
import { OfficeStatus } from '../types';

export function collectExecutiveStatus(workforce: WorkforcePlatform): OfficeStatus {
  const agents = workforce.listAgentsByOffice('Executive Office');
  return {
    office: 'Executive Office',
    health: agents.length === 6 ? 'healthy' : 'attention',
    agentCount: agents.length,
    activeTasks: agents.reduce((sum, a) => sum + workforce.getAgentTasks(a.agentId).length, 0),
    blockers: [],
    recentChanges: [],
  };
}
