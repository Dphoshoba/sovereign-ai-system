import { WorkforcePlatform } from '../workforce/workforce-platform';
import { ExecutiveIntelligence } from './intelligence-engine';

export { ExecutiveIntelligence } from './intelligence-engine';
export * from './types';

export function createExecutiveIntelligence(workforce: WorkforcePlatform): ExecutiveIntelligence {
  return new ExecutiveIntelligence(workforce);
}
