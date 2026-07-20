import { WorkforcePlatform } from '../workforce/workforce-platform';
import { AgentIdentity, CollaborationMode, WorkforcePolicy } from '../workforce/types';

export const KNOWLEDGE_AGENTS: AgentIdentity[] = [
  {
    agentId: 'KNOW-CUR-001', name: 'Knowledge Curation Agent', office: 'Knowledge Office',
    role: 'Knowledge Curation Agent', manager: 'Director of Knowledge', capabilities: ['knowledge.curation', 'metadata-management', 'versioning', 'cross-referencing'],
    authorityLevel: 'advisory', securityClassification: 'internal', status: 'active',
    version: '1.0.0', owner: 'Knowledge Office', createdAt: 0, updatedAt: 0,
  },
  {
    agentId: 'KNOW-SRCH-001', name: 'Knowledge Search Agent', office: 'Knowledge Office',
    role: 'Knowledge Search Agent', manager: 'Director of Knowledge', capabilities: ['knowledge.search', 'relevance-scoring', 'access-control'],
    authorityLevel: 'operational', securityClassification: 'internal', status: 'active',
    version: '1.0.0', owner: 'Knowledge Office', createdAt: 0, updatedAt: 0,
  },
  {
    agentId: 'KNOW-LESS-001', name: 'Lessons Learned Agent', office: 'Knowledge Office',
    role: 'Lessons Learned Agent', manager: 'Director of Knowledge', capabilities: ['knowledge.lessons', 'pattern-detection', 'applicability-scoring'],
    authorityLevel: 'advisory', securityClassification: 'internal', status: 'active',
    version: '1.0.0', owner: 'Knowledge Office', createdAt: 0, updatedAt: 0,
  },
  {
    agentId: 'KNOW-HLTH-001', name: 'Knowledge Health Agent', office: 'Knowledge Office',
    role: 'Knowledge Health Agent', manager: 'Director of Knowledge', capabilities: ['knowledge.health', 'freshness-scoring', 'gap-analysis', 'coverage-mapping'],
    authorityLevel: 'advisory', securityClassification: 'internal', status: 'active',
    version: '1.0.0', owner: 'Knowledge Office', createdAt: 0, updatedAt: 0,
  },
];

export const KNOWLEDGE_COLLAB_RULES = [
  { actionType: 'ingest-knowledge-entry', defaultMode: 'recommend' as CollaborationMode, escalateAfterMs: 7 * 86400000 },
  { actionType: 'update-existing-entry', defaultMode: 'act-autonomously' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'search-knowledge', defaultMode: 'act-autonomously' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'flag-access-violation', defaultMode: 'inform' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'capture-lesson', defaultMode: 'recommend' as CollaborationMode, escalateAfterMs: 14 * 86400000 },
  { actionType: 'recommend-applicable-lesson', defaultMode: 'inform' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'assess-knowledge-health', defaultMode: 'act-autonomously' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'flag-expired-entry', defaultMode: 'inform' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'recommend-gap-fill', defaultMode: 'inform' as CollaborationMode, escalateAfterMs: null },
];

export const KNOWLEDGE_SKILLS = [
  { skillId: 'KNOW-SKILL-CURATION', name: 'Knowledge Curation', category: 'Knowledge', version: '1.0.0', description: 'Ingest, structure, and version organizational knowledge', requiresApproval: false, relatedSkills: ['KNOW-SKILL-METADATA-MGMT', 'KNOW-SKILL-VERSIONING'] },
  { skillId: 'KNOW-SKILL-METADATA-MGMT', name: 'Metadata Management', category: 'Knowledge', version: '1.0.0', description: 'Manage knowledge entry metadata including author, source, date, and topic', requiresApproval: false, relatedSkills: ['KNOW-SKILL-CURATION'] },
  { skillId: 'KNOW-SKILL-VERSIONING', name: 'Knowledge Versioning', category: 'Knowledge', version: '1.0.0', description: 'Track and manage version history for all knowledge entries', requiresApproval: false, relatedSkills: ['KNOW-SKILL-CURATION'] },
  { skillId: 'KNOW-SKILL-SEARCH', name: 'Knowledge Search', category: 'Knowledge', version: '1.0.0', description: 'Provide intelligent search with relevance ranking across knowledge base', requiresApproval: false, relatedSkills: [] },
  { skillId: 'KNOW-SKILL-ACCESS-CONTROL', name: 'Access Control', category: 'Governance', version: '1.0.0', description: 'Enforce role-based access restrictions on sensitive knowledge', requiresApproval: false, relatedSkills: ['KNOW-SKILL-SEARCH'] },
  { skillId: 'KNOW-SKILL-LESSONS-CAPTURE', name: 'Lessons Capture', category: 'Knowledge', version: '1.0.0', description: 'Capture and categorize lessons from operational activities', requiresApproval: false, relatedSkills: ['KNOW-SKILL-PATTERN-DETECTION'] },
  { skillId: 'KNOW-SKILL-PATTERN-DETECTION', name: 'Knowledge Pattern Detection', category: 'Analysis', version: '1.0.0', description: 'Detect patterns across knowledge entries and operational data', requiresApproval: false, relatedSkills: ['KNOW-SKILL-LESSONS-CAPTURE'] },
  { skillId: 'KNOW-SKILL-HEALTH-MONITORING', name: 'Knowledge Health Monitoring', category: 'Knowledge', version: '1.0.0', description: 'Monitor coverage, freshness, usage, and gaps in knowledge base', requiresApproval: false, relatedSkills: ['KNOW-SKILL-FRESHNESS-SCORING'] },
  { skillId: 'KNOW-SKILL-FRESHNESS-SCORING', name: 'Knowledge Freshness Scoring', category: 'Knowledge', version: '1.0.0', description: 'Score knowledge entry freshness and flag expired content', requiresApproval: false, relatedSkills: ['KNOW-SKILL-HEALTH-MONITORING'] },
  { skillId: 'KNOW-SKILL-CROSS-REFERENCING', name: 'Cross-Referencing', category: 'Knowledge', version: '1.0.0', description: 'Link related knowledge entries across categories and workstreams', requiresApproval: false, relatedSkills: ['KNOW-SKILL-CURATION', 'KNOW-SKILL-SEARCH'] },
];

export const KNOWLEDGE_POLICIES: WorkforcePolicy[] = [
  { policyId: 'KNOW-POL-001', name: 'All Entries Must Have Complete Metadata', scope: 'tasks', effect: 'deny', condition: "capabilityScope == 'knowledge.curation' && (author == null || source == null || topic == null)", description: 'Knowledge entries require author, source, date, and topic per K-001.' },
  { policyId: 'KNOW-POL-002', name: 'Expired Entries Flagged After 2 Years', scope: 'tasks', effect: 'deny', condition: "capabilityScope == 'knowledge.health' && yearsSinceReview >= 2", description: 'Knowledge entries expire 2 years after last review per K-002.' },
  { policyId: 'KNOW-POL-003', name: 'AI-Proposed Entries Require Human Approval', scope: 'tasks', effect: 'require-approval', condition: "actionType == 'publish-knowledge-entry' && isAIGenerated == true", description: 'AI-proposed entries require human approval for initial publication per K-003.' },
  { policyId: 'KNOW-POL-004', name: 'Sensitive Knowledge Requires Authorized Access', scope: 'tasks', effect: 'deny', condition: "capabilityScope == 'knowledge.search' && isSensitive == true && authorizedWorkstream == null", description: 'Role-based access restricts sensitive knowledge per K-004.' },
  { policyId: 'KNOW-POL-005', name: 'Every Change Must Be Versioned', scope: 'tasks', effect: 'deny', condition: "capabilityScope == 'knowledge.curation' && isVersioned == false", description: 'Every knowledge change produces a versioned record per K-005.' },
];

export class KnowledgeOffice {
  constructor(private readonly workforce: WorkforcePlatform) {}

  deploy(): void {
    for (const agent of KNOWLEDGE_AGENTS) {
      this.workforce.registerAgent(agent);
      this.workforce.recordLifecycleEvent({
        eventId: '', agentId: agent.agentId, eventType: 'onboarded',
        timestamp: Date.now(), performedBy: 'EVDP-007', detail: `Deployed as ${agent.role}`,
      });
    }

    for (const skill of KNOWLEDGE_SKILLS) {
      this.workforce.registerSkill(skill);
    }

    const agentSkills: Record<string, string[]> = {
      'KNOW-CUR-001': ['KNOW-SKILL-CURATION', 'KNOW-SKILL-METADATA-MGMT', 'KNOW-SKILL-VERSIONING', 'KNOW-SKILL-CROSS-REFERENCING'],
      'KNOW-SRCH-001': ['KNOW-SKILL-SEARCH', 'KNOW-SKILL-ACCESS-CONTROL', 'KNOW-SKILL-CROSS-REFERENCING'],
      'KNOW-LESS-001': ['KNOW-SKILL-LESSONS-CAPTURE', 'KNOW-SKILL-PATTERN-DETECTION', 'KNOW-SKILL-CROSS-REFERENCING'],
      'KNOW-HLTH-001': ['KNOW-SKILL-HEALTH-MONITORING', 'KNOW-SKILL-FRESHNESS-SCORING'],
    };

    for (const [agentId, skills] of Object.entries(agentSkills)) {
      for (const skillId of skills) {
        this.workforce.assignSkillToAgent(agentId, skillId, 0.9);
      }
    }

    for (const rule of KNOWLEDGE_COLLAB_RULES) {
      this.workforce.setCollaborationRule(rule);
    }

    for (const policy of KNOWLEDGE_POLICIES) {
      this.workforce.addPolicy(policy);
    }
  }

  getAgent(agentId: string) { return this.workforce.getAgent(agentId); }
  listAgents() { return this.workforce.listAgentsByOffice('Knowledge Office'); }
}
