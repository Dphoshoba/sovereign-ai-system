import { WorkforcePlatform } from '../workforce/workforce-platform';
import { AgentIdentity, CollaborationMode, WorkforcePolicy } from '../workforce/types';

export const OPERATIONS_AGENTS: AgentIdentity[] = [
  {
    agentId: 'OPS-REV-001', name: 'Review Coordinator Agent', office: 'Operations Office',
    role: 'Review Coordinator Agent', manager: 'Director of Operations', capabilities: ['operations.review-coordination', 'scheduling', 'action-item-tracking'],
    authorityLevel: 'operational', securityClassification: 'internal', status: 'active',
    version: '1.0.0', owner: 'Operations Office', createdAt: 0, updatedAt: 0,
  },
  {
    agentId: 'OPS-PROJ-001', name: 'Project Tracker Agent', office: 'Operations Office',
    role: 'Project Tracker Agent', manager: 'Director of Operations', capabilities: ['operations.project-tracking', 'dependency-mapping', 'blocker-detection', 'resource-analysis'],
    authorityLevel: 'operational', securityClassification: 'internal', status: 'active',
    version: '1.0.0', owner: 'Operations Office', createdAt: 0, updatedAt: 0,
  },
  {
    agentId: 'OPS-DOC-001', name: 'Documentation Agent', office: 'Operations Office',
    role: 'Documentation Agent', manager: 'Director of Operations', capabilities: ['operations.documentation', 'content-analysis', 'freshness-scoring'],
    authorityLevel: 'advisory', securityClassification: 'internal', status: 'active',
    version: '1.0.0', owner: 'Operations Office', createdAt: 0, updatedAt: 0,
  },
  {
    agentId: 'OPS-DEPLOY-001', name: 'Deployment Readiness Agent', office: 'Operations Office',
    role: 'Deployment Readiness Agent', manager: 'Director of Operations', capabilities: ['operations.deployment-readiness', 'readiness-scoring', 'gate-verification'],
    authorityLevel: 'advisory', securityClassification: 'internal', status: 'active',
    version: '1.0.0', owner: 'Operations Office', createdAt: 0, updatedAt: 0,
  },
  {
    agentId: 'OPS-COMP-001', name: 'Compliance Monitor Agent', office: 'Operations Office',
    role: 'Compliance Monitor Agent', manager: 'Director of Operations', capabilities: ['operations.compliance', 'policy-evaluation', 'audit-analysis'],
    authorityLevel: 'advisory', securityClassification: 'internal', status: 'active',
    version: '1.0.0', owner: 'Operations Office', createdAt: 0, updatedAt: 0,
  },
];

export const OPERATIONS_COLLAB_RULES = [
  { actionType: 'schedule-operational-review', defaultMode: 'act-autonomously' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'flag-overdue-review', defaultMode: 'inform' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'track-project-progress', defaultMode: 'act-autonomously' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'escalate-at-risk-project', defaultMode: 'inform' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'propose-resource-reallocation', defaultMode: 'recommend' as CollaborationMode, escalateAfterMs: 7 * 86400000 },
  { actionType: 'scan-documentation-freshness', defaultMode: 'act-autonomously' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'flag-outdated-documentation', defaultMode: 'inform' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'suggest-archive', defaultMode: 'recommend' as CollaborationMode, escalateAfterMs: 30 * 86400000 },
  { actionType: 'check-deployment-readiness', defaultMode: 'act-autonomously' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'recommend-deployment-approval', defaultMode: 'recommend' as CollaborationMode, escalateAfterMs: 3 * 86400000 },
  { actionType: 'assess-compliance', defaultMode: 'act-autonomously' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'escalate-violation', defaultMode: 'inform' as CollaborationMode, escalateAfterMs: null },
];

export const OPERATIONS_SKILLS = [
  { skillId: 'OPS-SKILL-REVIEW-COORDINATION', name: 'Review Coordination', category: 'Operations', version: '1.0.0', description: 'Schedule and track recurring operational reviews', requiresApproval: false, relatedSkills: ['OPS-SKILL-ACTION-TRACKING'] },
  { skillId: 'OPS-SKILL-ACTION-TRACKING', name: 'Action Item Tracking', category: 'Operations', version: '1.0.0', description: 'Track action items through completion across workstreams', requiresApproval: false, relatedSkills: ['OPS-SKILL-REVIEW-COORDINATION'] },
  { skillId: 'OPS-SKILL-PROJECT-MONITORING', name: 'Project Monitoring', category: 'Operations', version: '1.0.0', description: 'Monitor project health with dependency-aware progress tracking', requiresApproval: false, relatedSkills: ['OPS-SKILL-BLOCKER-DETECTION'] },
  { skillId: 'OPS-SKILL-BLOCKER-DETECTION', name: 'Blocker Detection', category: 'Operations', version: '1.0.0', description: 'Detect and escalate project blockers and resource conflicts', requiresApproval: false, relatedSkills: ['OPS-SKILL-PROJECT-MONITORING'] },
  { skillId: 'OPS-SKILL-DOCUMENTATION-MGMT', name: 'Documentation Management', category: 'Operations', version: '1.0.0', description: 'Maintain operational documentation freshness and coverage', requiresApproval: false, relatedSkills: [] },
  { skillId: 'OPS-SKILL-FRESHNESS-SCORING', name: 'Freshness Scoring', category: 'Operations', version: '1.0.0', description: 'Score documentation freshness and flag stale content', requiresApproval: false, relatedSkills: ['OPS-SKILL-DOCUMENTATION-MGMT'] },
  { skillId: 'OPS-SKILL-DEPLOYMENT-READINESS', name: 'Deployment Readiness', category: 'Operations', version: '1.0.0', description: 'Verify deployment prerequisites and governance gate compliance', requiresApproval: false, relatedSkills: ['OPS-SKILL-GATE-VERIFICATION'] },
  { skillId: 'OPS-SKILL-GATE-VERIFICATION', name: 'Gate Verification', category: 'Operations', version: '1.0.0', description: 'Verify governance gate status for deployment approvals', requiresApproval: false, relatedSkills: ['OPS-SKILL-DEPLOYMENT-READINESS'] },
  { skillId: 'OPS-SKILL-COMPLIANCE-MONITORING', name: 'Compliance Monitoring', category: 'Governance', version: '1.0.0', description: 'Track governance compliance and policy violation trends', requiresApproval: false, relatedSkills: ['OPS-SKILL-GATE-VERIFICATION'] },
  { skillId: 'OPS-SKILL-AUDIT-ANALYSIS', name: 'Audit Analysis', category: 'Governance', version: '1.0.0', description: 'Analyze audit trail data for compliance insights', requiresApproval: false, relatedSkills: ['OPS-SKILL-COMPLIANCE-MONITORING'] },
  { skillId: 'OPS-SKILL-SCHEDULING', name: 'Operations Scheduling', category: 'Operations', version: '1.0.0', description: 'Manage scheduling of reviews, deployments, and operational events', requiresApproval: false, relatedSkills: ['OPS-SKILL-REVIEW-COORDINATION'] },
];

export const OPERATIONS_POLICIES: WorkforcePolicy[] = [
  { policyId: 'OPS-POL-001', name: 'Reviews Require Defined Cadence', scope: 'tasks', effect: 'deny', condition: "capabilityScope == 'operations.review-coordination' && reviewCadenceDays == null", description: 'Reviews must have defined cadence per O-001.' },
  { policyId: 'OPS-POL-002', name: 'At-Risk Projects Auto-Escalate', scope: 'tasks', effect: 'require-approval', condition: "actionType == 'delay-project' && weeksBehind >= 2", description: 'Projects >2 weeks behind require escalation per O-002.' },
  { policyId: 'OPS-POL-003', name: 'Deployment Requires All Gates Passed', scope: 'tasks', effect: 'deny', condition: "capabilityScope == 'operations.deployment-readiness' && gatesPassed < totalGates", description: 'Deployment requires all governance gates passed per O-003.' },
  { policyId: 'OPS-POL-004', name: 'Compliance Violations Acknowledged Within 7 Days', scope: 'tasks', effect: 'require-approval', condition: "actionType == 'acknowledge-violation' && daysSinceViolation > 7", description: 'Violations must be acknowledged within 7 days per O-004.' },
  { policyId: 'OPS-POL-005', name: 'Documentation Refresh Within 90 Days', scope: 'tasks', effect: 'deny', condition: "capabilityScope == 'operations.documentation' && daysSinceUpdate > 90", description: 'Documentation must be refreshed within 90 days or flagged stale per O-005.' },
];

export class OperationsOffice {
  constructor(private readonly workforce: WorkforcePlatform) {}

  deploy(): void {
    for (const agent of OPERATIONS_AGENTS) {
      this.workforce.registerAgent(agent);
      this.workforce.recordLifecycleEvent({
        eventId: '', agentId: agent.agentId, eventType: 'onboarded',
        timestamp: Date.now(), performedBy: 'EVDP-006', detail: `Deployed as ${agent.role}`,
      });
    }

    for (const skill of OPERATIONS_SKILLS) {
      this.workforce.registerSkill(skill);
    }

    const agentSkills: Record<string, string[]> = {
      'OPS-REV-001': ['OPS-SKILL-REVIEW-COORDINATION', 'OPS-SKILL-ACTION-TRACKING', 'OPS-SKILL-SCHEDULING'],
      'OPS-PROJ-001': ['OPS-SKILL-PROJECT-MONITORING', 'OPS-SKILL-BLOCKER-DETECTION', 'OPS-SKILL-SCHEDULING'],
      'OPS-DOC-001': ['OPS-SKILL-DOCUMENTATION-MGMT', 'OPS-SKILL-FRESHNESS-SCORING'],
      'OPS-DEPLOY-001': ['OPS-SKILL-DEPLOYMENT-READINESS', 'OPS-SKILL-GATE-VERIFICATION', 'OPS-SKILL-SCHEDULING'],
      'OPS-COMP-001': ['OPS-SKILL-COMPLIANCE-MONITORING', 'OPS-SKILL-AUDIT-ANALYSIS', 'OPS-SKILL-GATE-VERIFICATION'],
    };

    for (const [agentId, skills] of Object.entries(agentSkills)) {
      for (const skillId of skills) {
        this.workforce.assignSkillToAgent(agentId, skillId, 0.9);
      }
    }

    for (const rule of OPERATIONS_COLLAB_RULES) {
      this.workforce.setCollaborationRule(rule);
    }

    for (const policy of OPERATIONS_POLICIES) {
      this.workforce.addPolicy(policy);
    }
  }

  getAgent(agentId: string) { return this.workforce.getAgent(agentId); }
  listAgents() { return this.workforce.listAgentsByOffice('Operations Office'); }
}
