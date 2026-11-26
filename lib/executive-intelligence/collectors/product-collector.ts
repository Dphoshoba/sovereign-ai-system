import { WorkforcePlatform } from '../../workforce/workforce-platform';
import { OfficeStatus } from '../types';

export function collectProductStatus(workforce: WorkforcePlatform): OfficeStatus {
  const agents = workforce.listAgentsByOffice('Product Office');
  return {
    office: 'Product Office',
    health: agents.length === 5 ? 'healthy' : 'attention',
    agentCount: agents.length,
    activeTasks: agents.reduce((sum, a) => sum + workforce.getAgentTasks(a.agentId).length, 0),
    blockers: [],
    recentChanges: [],
  };
}
