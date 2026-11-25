import { WorkforcePlatform } from '../workforce/workforce-platform';
import { AgentIdentity, CollaborationMode, WorkforcePolicy } from '../workforce/types';

export const RESEARCH_AGENTS: AgentIdentity[] = [
  {
    agentId: 'RES-COL-001', name: 'Research Collection Agent', office: 'Research Office',
    role: 'Research Collection Agent', manager: 'Director of Research', capabilities: ['research.collection', 'data-ingestion', 'source-verification'],
    authorityLevel: 'operational', securityClassification: 'internal', status: 'active',
    version: '1.0.0', owner: 'Research Office', createdAt: 0, updatedAt: 0,
  },
  {
    agentId: 'RES-SYNTH-001', name: 'Evidence Synthesizer Agent', office: 'Research Office',
    role: 'Evidence Synthesizer Agent', manager: 'Director of Research', capabilities: ['research.synthesis', 'pattern-detection', 'gap-analysis', 'cross-referencing'],
    authorityLevel: 'advisory', securityClassification: 'internal', status: 'active',
    version: '1.0.0', owner: 'Research Office', createdAt: 0, updatedAt: 0,
  },
  {
    agentId: 'RES-REUSE-001', name: 'Research Reuse Agent', office: 'Research Office',
    role: 'Research Reuse Agent', manager: 'Director of Research', capabilities: ['research.reuse', 'relevance-scoring', 'cross-product-query'],
    authorityLevel: 'advisory', securityClassification: 'internal', status: 'active',
    version: '1.0.0', owner: 'Research Office', createdAt: 0, updatedAt: 0,
  },
  {
    agentId: 'RES-QUAL-001', name: 'Research Quality Agent', office: 'Research Office',
    role: 'Research Quality Agent', manager: 'Director of Research', capabilities: ['research.quality', 'quality-scoring', 'methodology-review'],
    authorityLevel: 'advisory', securityClassification: 'internal', status: 'active',
    version: '1.0.0', owner: 'Research Office', createdAt: 0, updatedAt: 0,
  },
];

export const RESEARCH_COLLAB_RULES = [
  { actionType: 'collect-research-data', defaultMode: 'act-autonomously' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'flag-low-confidence-entry', defaultMode: 'inform' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'synthesize-evidence', defaultMode: 'recommend' as CollaborationMode, escalateAfterMs: 7 * 86400000 },
  { actionType: 'flag-speculative-connection', defaultMode: 'inform' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'produce-gap-analysis', defaultMode: 'act-autonomously' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'notify-research-applicable', defaultMode: 'inform' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'score-relevance', defaultMode: 'act-autonomously' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'assess-quality', defaultMode: 'act-autonomously' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'flag-outdated-research', defaultMode: 'inform' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'recommend-archive', defaultMode: 'recommend' as CollaborationMode, escalateAfterMs: 30 * 86400000 },
];

export const RESEARCH_SKILLS = [
  { skillId: 'RES-SKILL-DATA-INGESTION', name: 'Data Ingestion', category: 'Research', version: '1.0.0', description: 'Ingest research data from internal and external sources', requiresApproval: false, relatedSkills: ['RES-SKILL-SOURCE-VERIFICATION'] },
  { skillId: 'RES-SKILL-SOURCE-VERIFICATION', name: 'Source Verification', category: 'Research', version: '1.0.0', description: 'Verify and score research source reliability', requiresApproval: false, relatedSkills: ['RES-SKILL-DATA-INGESTION'] },
  { skillId: 'RES-SKILL-SYNTHESIS', name: 'Evidence Synthesis', category: 'Research', version: '1.0.0', description: 'Cross-reference findings across products to identify shared insights', requiresApproval: false, relatedSkills: ['RES-SKILL-PATTERN-DETECTION'] },
  { skillId: 'RES-SKILL-PATTERN-DETECTION', name: 'Pattern Detection', category: 'Analysis', version: '1.0.0', description: 'Detect patterns across research data and user behaviour', requiresApproval: false, relatedSkills: ['RES-SKILL-SYNTHESIS'] },
  { skillId: 'RES-SKILL-GAP-ANALYSIS', name: 'Research Gap Analysis', category: 'Analysis', version: '1.0.0', description: 'Identify gaps and opportunities in research coverage', requiresApproval: false, relatedSkills: ['RES-SKILL-SYNTHESIS'] },
  { skillId: 'RES-SKILL-RELEVANCE-SCORING', name: 'Relevance Scoring', category: 'Analysis', version: '1.0.0', description: 'Score research relevance to product capabilities', requiresApproval: false, relatedSkills: [] },
  { skillId: 'RES-SKILL-QUALITY-ASSESSMENT', name: 'Quality Assessment', category: 'Governance', version: '1.0.0', description: 'Assess research quality against methodology standards', requiresApproval: false, relatedSkills: ['RES-SKILL-METHODOLOGY-REVIEW'] },
  { skillId: 'RES-SKILL-METHODOLOGY-REVIEW', name: 'Methodology Review', category: 'Governance', version: '1.0.0', description: 'Review and recommend research methodology improvements', requiresApproval: false, relatedSkills: ['RES-SKILL-QUALITY-ASSESSMENT'] },
  { skillId: 'RES-SKILL-CROSS-PRODUCT-QUERY', name: 'Cross-Product Query', category: 'Analysis', version: '1.0.0', description: 'Query research data across multiple product domains', requiresApproval: false, relatedSkills: [] },
];

export const RESEARCH_POLICIES: WorkforcePolicy[] = [
  { policyId: 'RES-POL-001', name: 'All Research Entries Must Include Source Verification', scope: 'tasks', effect: 'deny', condition: "capabilityScope == 'research.collection' && entryConfidence == null", description: 'Research entries require source verification and confidence score per R-001.' },
  { policyId: 'RES-POL-002', name: 'Cross-Product Reuse Notifications Are Advisory Only', scope: 'collaboration', effect: 'deny', condition: "actionType == 'notify-research-applicable' && defaultMode != 'inform'", description: 'Research reuse notifications are advisory per R-002.' },
  { policyId: 'RES-POL-003', name: 'Outdated Research Requires Review Before Reuse', scope: 'tasks', effect: 'require-approval', condition: "actionType == 'reuse-research' && isOutdated == true", description: 'Research >2 years without review requires human approval per R-003.' },
  { policyId: 'RES-POL-004', name: 'Low-Confidence Research Excluded from Synthesis', scope: 'tasks', effect: 'deny', condition: "capabilityScope == 'research.synthesis' && crossRefConfidence < 0.5", description: 'Research with confidence < 0.5 excluded from synthesis per R-004.' },
];

export class ResearchOffice {
  constructor(private readonly workforce: WorkforcePlatform) {}

  deploy(): void {
    for (const agent of RESEARCH_AGENTS) {
      this.workforce.registerAgent(agent);
      this.workforce.recordLifecycleEvent({
        eventId: '', agentId: agent.agentId, eventType: 'onboarded',
        timestamp: Date.now(), performedBy: 'EVDP-004', detail: `Deployed as ${agent.role}`,
      });
    }

    for (const skill of RESEARCH_SKILLS) {
      this.workforce.registerSkill(skill);
    }

    const agentSkills: Record<string, string[]> = {
      'RES-COL-001': ['RES-SKILL-DATA-INGESTION', 'RES-SKILL-SOURCE-VERIFICATION', 'RES-SKILL-CROSS-PRODUCT-QUERY'],
      'RES-SYNTH-001': ['RES-SKILL-SYNTHESIS', 'RES-SKILL-PATTERN-DETECTION', 'RES-SKILL-GAP-ANALYSIS', 'RES-SKILL-CROSS-PRODUCT-QUERY'],
      'RES-REUSE-001': ['RES-SKILL-RELEVANCE-SCORING', 'RES-SKILL-CROSS-PRODUCT-QUERY', 'RES-SKILL-PATTERN-DETECTION'],
      'RES-QUAL-001': ['RES-SKILL-QUALITY-ASSESSMENT', 'RES-SKILL-METHODOLOGY-REVIEW', 'RES-SKILL-SOURCE-VERIFICATION'],
    };

    for (const [agentId, skills] of Object.entries(agentSkills)) {
      for (const skillId of skills) {
        this.workforce.assignSkillToAgent(agentId, skillId, 0.9);
      }
    }

    for (const rule of RESEARCH_COLLAB_RULES) {
      this.workforce.setCollaborationRule(rule);
    }

    for (const policy of RESEARCH_POLICIES) {
      this.workforce.addPolicy(policy);
    }
  }

  getAgent(agentId: string) { return this.workforce.getAgent(agentId); }
  listAgents() { return this.workforce.listAgentsByOffice('Research Office'); }
}
