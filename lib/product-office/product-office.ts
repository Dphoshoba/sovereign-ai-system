import { WorkforcePlatform } from '../workforce/workforce-platform';
import { AgentIdentity, CollaborationMode, WorkforcePolicy } from '../workforce/types';

export const PRODUCT_AGENTS: AgentIdentity[] = [
  {
    agentId: 'PROD-RMAP-001', name: 'Roadmap Coordinator Agent', office: 'Product Office',
    role: 'Roadmap Coordinator Agent', manager: 'Director of Product', capabilities: ['product.roadmap', 'dependency-mapping', 'timeline-analysis'],
    authorityLevel: 'operational', securityClassification: 'internal', status: 'active',
    version: '1.0.0', owner: 'Product Office', createdAt: 0, updatedAt: 0,
  },
  {
    agentId: 'PROD-CAP-001', name: 'Capability Registry Agent', office: 'Product Office',
    role: 'Capability Registry Agent', manager: 'Director of Product', capabilities: ['product.capability-registry', 'duplication-detection', 'catalog-management'],
    authorityLevel: 'advisory', securityClassification: 'internal', status: 'active',
    version: '1.0.0', owner: 'Product Office', createdAt: 0, updatedAt: 0,
  },
  {
    agentId: 'PROD-REL-001', name: 'Release Planner Agent', office: 'Product Office',
    role: 'Release Planner Agent', manager: 'Director of Product', capabilities: ['product.release-planning', 'conflict-resolution', 'dependency-aware-sequencing'],
    authorityLevel: 'advisory', securityClassification: 'internal', status: 'active',
    version: '1.0.0', owner: 'Product Office', createdAt: 0, updatedAt: 0,
  },
  {
    agentId: 'PROD-PRI-001', name: 'Feature Prioritization Agent', office: 'Product Office',
    role: 'Feature Prioritization Agent', manager: 'Director of Product', capabilities: ['product.prioritization', 'value-analysis', 'strategic-alignment-scoring'],
    authorityLevel: 'advisory', securityClassification: 'internal', status: 'active',
    version: '1.0.0', owner: 'Product Office', createdAt: 0, updatedAt: 0,
  },
  {
    agentId: 'PROD-DEP-001', name: 'Dependency Tracker Agent', office: 'Product Office',
    role: 'Dependency Tracker Agent', manager: 'Director of Product', capabilities: ['product.dependency-tracking', 'impact-analysis', 'change-detection'],
    authorityLevel: 'operational', securityClassification: 'internal', status: 'active',
    version: '1.0.0', owner: 'Product Office', createdAt: 0, updatedAt: 0,
  },
];

export const PRODUCT_COLLAB_RULES = [
  { actionType: 'collect-roadmap-updates', defaultMode: 'act-autonomously' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'propose-roadmap-change', defaultMode: 'recommend' as CollaborationMode, escalateAfterMs: 7 * 86400000 },
  { actionType: 'scan-capability-registrations', defaultMode: 'act-autonomously' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'recommend-capability-consolidation', defaultMode: 'inform' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'flag-stale-registration', defaultMode: 'inform' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'plan-release-schedule', defaultMode: 'recommend' as CollaborationMode, escalateAfterMs: 14 * 86400000 },
  { actionType: 'detect-release-conflict', defaultMode: 'inform' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'prioritize-features', defaultMode: 'inform' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'score-strategic-alignment', defaultMode: 'act-autonomously' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'track-dependencies', defaultMode: 'act-autonomously' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'alert-breaking-change', defaultMode: 'inform' as CollaborationMode, escalateAfterMs: null },
];

export const PRODUCT_SKILLS = [
  { skillId: 'PROD-SKILL-ROADMAP-MGMT', name: 'Roadmap Management', category: 'Product', version: '1.0.0', description: 'Maintain unified product roadmap views with cross-product dependencies', requiresApproval: false, relatedSkills: ['PROD-SKILL-DEPENDENCY-MAPPING'] },
  { skillId: 'PROD-SKILL-DEPENDENCY-MAPPING', name: 'Dependency Mapping', category: 'Product', version: '1.0.0', description: 'Map and visualize cross-product technical dependencies', requiresApproval: false, relatedSkills: ['PROD-SKILL-IMPACT-ANALYSIS'] },
  { skillId: 'PROD-SKILL-IMPACT-ANALYSIS', name: 'Impact Analysis', category: 'Analysis', version: '1.0.0', description: 'Analyze change impact across product dependencies', requiresApproval: false, relatedSkills: ['PROD-SKILL-DEPENDENCY-MAPPING'] },
  { skillId: 'PROD-SKILL-CAPABILITY-REGISTRY', name: 'Capability Registry', category: 'Product', version: '1.0.0', description: 'Track and catalog shared product capabilities', requiresApproval: false, relatedSkills: ['PROD-SKILL-DUPLICATION-DETECTION'] },
  { skillId: 'PROD-SKILL-DUPLICATION-DETECTION', name: 'Duplication Detection', category: 'Analysis', version: '1.0.0', description: 'Detect duplicate capabilities across product ecosystem', requiresApproval: false, relatedSkills: ['PROD-SKILL-CAPABILITY-REGISTRY'] },
  { skillId: 'PROD-SKILL-RELEASE-PLANNING', name: 'Release Planning', category: 'Product', version: '1.0.0', description: 'Coordinate release scheduling across products', requiresApproval: false, relatedSkills: ['PROD-SKILL-DEPENDENCY-MAPPING', 'PROD-SKILL-CONFLICT-RESOLUTION'] },
  { skillId: 'PROD-SKILL-CONFLICT-RESOLUTION', name: 'Conflict Resolution', category: 'Product', version: '1.0.0', description: 'Detect and propose resolutions for scheduling conflicts', requiresApproval: false, relatedSkills: ['PROD-SKILL-RELEASE-PLANNING'] },
  { skillId: 'PROD-SKILL-PRIORITIZATION', name: 'Feature Prioritization', category: 'Strategy', version: '1.0.0', description: 'Score and prioritize features by value, cost, and strategic alignment', requiresApproval: false, relatedSkills: ['PROD-SKILL-VALUE-ANALYSIS', 'PROD-SKILL-STRATEGIC-ALIGNMENT'] },
  { skillId: 'PROD-SKILL-VALUE-ANALYSIS', name: 'Value Analysis', category: 'Strategy', version: '1.0.0', description: 'Calculate value/cost ratios for features and initiatives', requiresApproval: false, relatedSkills: ['PROD-SKILL-PRIORITIZATION'] },
  { skillId: 'PROD-SKILL-STRATEGIC-ALIGNMENT', name: 'Strategic Alignment Scoring', category: 'Strategy', version: '1.0.0', description: 'Score feature alignment with executive strategic priorities', requiresApproval: false, relatedSkills: ['PROD-SKILL-PRIORITIZATION'] },
  { skillId: 'PROD-SKILL-TIMELINE-ANALYSIS', name: 'Timeline Analysis', category: 'Analysis', version: '1.0.0', description: 'Assess timeline risks and dependency impacts on schedules', requiresApproval: false, relatedSkills: ['PROD-SKILL-ROADMAP-MGMT', 'PROD-SKILL-RELEASE-PLANNING'] },
];

export const PRODUCT_POLICIES: WorkforcePolicy[] = [
  { policyId: 'PROD-POL-001', name: 'Capability Registrations Must Be Current', scope: 'tasks', effect: 'deny', condition: "capabilityScope == 'product.capability-registry' && daysSinceUpdate > 30", description: 'Registrations must be current within 30 days per P-001.' },
  { policyId: 'PROD-POL-002', name: 'Cross-Product Dependency Changes Require Notification', scope: 'tasks', effect: 'require-approval', condition: "actionType == 'change-dependency' && affectedProducts >= 2", description: 'Changes affecting 2+ products require notification per P-002.' },
  { policyId: 'PROD-POL-003', name: 'Prioritization Must Include Confidence and Data Sources', scope: 'tasks', effect: 'deny', condition: "capabilityScope == 'product.prioritization' && (confidenceScore == null || dataSources == null)", description: 'Feature prioritization must include confidence score and data sources per P-003.' },
  { policyId: 'PROD-POL-004', name: 'Roadmap Changes Outside Scope Require Approval', scope: 'collaboration', effect: 'require-approval', condition: "actionType == 'propose-roadmap-change' && outsideApprovedScope == true", description: 'Roadmap changes outside approved scope require product manager approval per P-004.' },
];

export class ProductOffice {
  constructor(private readonly workforce: WorkforcePlatform) {}

  deploy(): void {
    for (const agent of PRODUCT_AGENTS) {
      this.workforce.registerAgent(agent);
      this.workforce.recordLifecycleEvent({
        eventId: '', agentId: agent.agentId, eventType: 'onboarded',
        timestamp: Date.now(), performedBy: 'EVDP-005', detail: `Deployed as ${agent.role}`,
      });
    }

    for (const skill of PRODUCT_SKILLS) {
      this.workforce.registerSkill(skill);
    }

    const agentSkills: Record<string, string[]> = {
      'PROD-RMAP-001': ['PROD-SKILL-ROADMAP-MGMT', 'PROD-SKILL-DEPENDENCY-MAPPING', 'PROD-SKILL-TIMELINE-ANALYSIS'],
      'PROD-CAP-001': ['PROD-SKILL-CAPABILITY-REGISTRY', 'PROD-SKILL-DUPLICATION-DETECTION'],
      'PROD-REL-001': ['PROD-SKILL-RELEASE-PLANNING', 'PROD-SKILL-CONFLICT-RESOLUTION', 'PROD-SKILL-DEPENDENCY-MAPPING'],
      'PROD-PRI-001': ['PROD-SKILL-PRIORITIZATION', 'PROD-SKILL-VALUE-ANALYSIS', 'PROD-SKILL-STRATEGIC-ALIGNMENT'],
      'PROD-DEP-001': ['PROD-SKILL-DEPENDENCY-MAPPING', 'PROD-SKILL-IMPACT-ANALYSIS', 'PROD-SKILL-TIMELINE-ANALYSIS'],
    };

    for (const [agentId, skills] of Object.entries(agentSkills)) {
      for (const skillId of skills) {
        this.workforce.assignSkillToAgent(agentId, skillId, 0.9);
      }
    }

    for (const rule of PRODUCT_COLLAB_RULES) {
      this.workforce.setCollaborationRule(rule);
    }

    for (const policy of PRODUCT_POLICIES) {
      this.workforce.addPolicy(policy);
    }
  }

  getAgent(agentId: string) { return this.workforce.getAgent(agentId); }
  listAgents() { return this.workforce.listAgentsByOffice('Product Office'); }
}
