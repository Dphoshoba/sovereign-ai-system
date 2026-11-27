import { WorkforcePlatform } from '../workforce/workforce-platform';
import { AgentIdentity, CollaborationMode, Task, TaskStatus, WorkforcePolicy } from '../workforce/types';

// ── Agent Identities ──

export const EXECUTIVE_AGENTS: AgentIdentity[] = [
  {
    agentId: 'EXEC-BRIEF-001', name: 'Executive Briefing Agent', office: 'Executive Office',
    role: 'Executive Briefing Agent', manager: 'CEO', capabilities: ['summarization', 'analysis', 'scheduling'],
    authorityLevel: 'advisory', securityClassification: 'executive', status: 'active',
    version: '1.0.0', owner: 'CEO Office', createdAt: 0, updatedAt: 0,
  },
  {
    agentId: 'EXEC-STRAT-001', name: 'Strategic Planning Agent', office: 'Executive Office',
    role: 'Strategic Planning Agent', manager: 'CEO', capabilities: ['research', 'analysis', 'planning', 'reasoning'],
    authorityLevel: 'advisory', securityClassification: 'executive', status: 'active',
    version: '1.0.0', owner: 'CEO Office', createdAt: 0, updatedAt: 0,
  },
  {
    agentId: 'EXEC-PORT-001', name: 'Priority & Portfolio Agent', office: 'Executive Office',
    role: 'Priority & Portfolio Agent', manager: 'CEO', capabilities: ['planning', 'analysis', 'scheduling', 'decision-support'],
    authorityLevel: 'operational', securityClassification: 'executive', status: 'active',
    version: '1.0.0', owner: 'CEO Office', createdAt: 0, updatedAt: 0,
  },
  {
    agentId: 'EXEC-RISK-001', name: 'Governance & Risk Advisor', office: 'Executive Office',
    role: 'Governance & Risk Advisor', manager: 'CEO', capabilities: ['analysis', 'governance', 'reasoning'],
    authorityLevel: 'advisory', securityClassification: 'executive', status: 'active',
    version: '1.0.0', owner: 'CEO Office', createdAt: 0, updatedAt: 0,
  },
  {
    agentId: 'EXEC-MEET-001', name: 'Meeting Intelligence Agent', office: 'Executive Office',
    role: 'Meeting Intelligence Agent', manager: 'CEO', capabilities: ['summarization', 'scheduling', 'communication'],
    authorityLevel: 'advisory', securityClassification: 'confidential', status: 'active',
    version: '1.0.0', owner: 'CEO Office', createdAt: 0, updatedAt: 0,
  },
  {
    agentId: 'EXEC-COMMS-001', name: 'Executive Communications Agent', office: 'Executive Office',
    role: 'Executive Communications Agent', manager: 'CEO', capabilities: ['writing', 'communication', 'planning'],
    authorityLevel: 'advisory', securityClassification: 'executive', status: 'active',
    version: '1.0.0', owner: 'CEO Office', createdAt: 0, updatedAt: 0,
  },
];

// ── Collaboration Rules ──

export const EXECUTIVE_COLLAB_RULES = [
  { actionType: 'produce-daily-briefing', defaultMode: 'act-autonomously' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'recommend-strategic-direction', defaultMode: 'recommend' as CollaborationMode, escalateAfterMs: 7 * 86400000 },
  { actionType: 'adjust-priority', defaultMode: 'recommend' as CollaborationMode, escalateAfterMs: 86400000 },
  { actionType: 'flag-critical-risk', defaultMode: 'inform' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'prepare-meeting-packet', defaultMode: 'act-autonomously' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'draft-executive-communication', defaultMode: 'recommend' as CollaborationMode, escalateAfterMs: 86400000 },
  { actionType: 'escalate-risk', defaultMode: 'inform' as CollaborationMode, escalateAfterMs: null },
  { actionType: 'produce-portfolio-report', defaultMode: 'act-autonomously' as CollaborationMode, escalateAfterMs: null },
];

// ── Skills ──

export const EXECUTIVE_SKILLS = [
  { skillId: 'EXEC-SKILL-SUMMARIZATION', name: 'Summarization', category: 'Communication', version: '1.0.0', description: 'Synthesize complex information into concise summaries', requiresApproval: false, relatedSkills: ['EXEC-SKILL-ANALYSIS', 'EXEC-SKILL-COMMUNICATION'] },
  { skillId: 'EXEC-SKILL-ANALYSIS', name: 'Executive Analysis', category: 'Analysis', version: '1.0.0', description: 'Analyze business data, trends, and strategic options', requiresApproval: false, relatedSkills: ['EXEC-SKILL-REASONING'] },
  { skillId: 'EXEC-SKILL-STRATEGIC-PLANNING', name: 'Strategic Planning', category: 'Planning', version: '1.0.0', description: 'Develop strategic plans, scenarios, and roadmaps', requiresApproval: false, relatedSkills: ['EXEC-SKILL-ANALYSIS', 'EXEC-SKILL-REASONING'] },
  { skillId: 'EXEC-SKILL-RISK-ASSESSMENT', name: 'Risk Assessment', category: 'Governance', version: '1.0.0', description: 'Identify, assess, and recommend mitigation for organizational risks', requiresApproval: false, relatedSkills: ['EXEC-SKILL-ANALYSIS', 'EXEC-SKILL-GOVERNANCE'] },
  { skillId: 'EXEC-SKILL-GOVERNANCE', name: 'Governance Advisory', category: 'Governance', version: '1.0.0', description: 'Provide governance guidance and compliance oversight', requiresApproval: false, relatedSkills: ['EXEC-SKILL-ANALYSIS', 'EXEC-SKILL-REASONING'] },
  { skillId: 'EXEC-SKILL-REASONING', name: 'Executive Reasoning', category: 'Analysis', version: '1.0.0', description: 'Apply structured reasoning to complex problems', requiresApproval: false, relatedSkills: ['EXEC-SKILL-ANALYSIS'] },
  { skillId: 'EXEC-SKILL-DECISION-SUPPORT', name: 'Decision Support', category: 'Analysis', version: '1.0.0', description: 'Evaluate options and provide decision recommendations', requiresApproval: false, relatedSkills: ['EXEC-SKILL-ANALYSIS', 'EXEC-SKILL-REASONING'] },
  { skillId: 'EXEC-SKILL-PLANNING', name: 'General Planning', category: 'Planning', version: '1.0.0', description: 'Plan and coordinate multi-step activities', requiresApproval: false, relatedSkills: ['EXEC-SKILL-SCHEDULING'] },
  { skillId: 'EXEC-SKILL-COMMUNICATION', name: 'Executive Communication', category: 'Communication', version: '1.0.0', description: 'Draft and coordinate executive-level communications', requiresApproval: true, relatedSkills: ['EXEC-SKILL-WRITING'] },
  { skillId: 'EXEC-SKILL-PORTFOLIO-MGMT', name: 'Portfolio Management', category: 'Planning', version: '1.0.0', description: 'Manage and track cross-workstream priorities and dependencies', requiresApproval: false, relatedSkills: ['EXEC-SKILL-ANALYSIS', 'EXEC-SKILL-STRATEGIC-PLANNING'] },
  { skillId: 'EXEC-SKILL-MEETING-INTELLIGENCE', name: 'Meeting Intelligence', category: 'Communication', version: '1.0.0', description: 'Prepare, track, and follow up on executive meetings', requiresApproval: false, relatedSkills: ['EXEC-SKILL-SUMMARIZATION', 'EXEC-SKILL-SCHEDULING'] },
  { skillId: 'EXEC-SKILL-SCHEDULING', name: 'Executive Scheduling', category: 'Planning', version: '1.0.0', description: 'Manage time-sensitive scheduling and deadlines', requiresApproval: false, relatedSkills: ['EXEC-SKILL-PORTFOLIO-MGMT'] },
  { skillId: 'EXEC-SKILL-WRITING', name: 'Executive Writing', category: 'Communication', version: '1.0.0', description: 'Write clear, authoritative executive communications', requiresApproval: true, relatedSkills: ['EXEC-SKILL-COMMUNICATION'] },
];

// ── Workforce Policies ──

export const EXECUTIVE_POLICIES: WorkforcePolicy[] = [
  { policyId: 'EXEC-POL-001', name: 'Briefing Agents Cannot Adjust Priorities Directly', scope: 'tasks', effect: 'deny', condition: "agentId.startsWith('EXEC-BRIEF') && actionType == 'adjust-priority'", description: 'Briefing agents recommend; priority agents adjust.' },
  { policyId: 'EXEC-POL-002', name: 'Strategic Recommendations Require Review', scope: 'collaboration', effect: 'require-approval', condition: "actionType == 'recommend-strategic-direction'", description: 'Strategic direction changes require CEO review.' },
  { policyId: 'EXEC-POL-003', name: 'Risk Escalation Must Be Informational Only', scope: 'collaboration', effect: 'deny', condition: "actionType == 'escalate-risk' && defaultMode != 'inform'", description: 'Risk escalation informs; does not override human decision.' },
  { policyId: 'EXEC-POL-004', name: 'Executive Communications Require Approval', scope: 'tasks', effect: 'require-approval', condition: "actionType == 'draft-executive-communication'", description: 'External communications require CEO sign-off.' },
];

// ── Office Orchestrator ──

export class ExecutiveOffice {
  constructor(private readonly workforce: WorkforcePlatform) {}

  deploy(): void {
    // Register agent identities
    for (const agent of EXECUTIVE_AGENTS) {
      this.workforce.registerAgent(agent);
      this.workforce.recordLifecycleEvent({
        eventId: '', agentId: agent.agentId, eventType: 'onboarded',
        timestamp: Date.now(), performedBy: 'EVDP-003', detail: `Deployed as ${agent.role}`,
      });
    }

    // Register skills
    for (const skill of EXECUTIVE_SKILLS) {
      this.workforce.registerSkill(skill);
    }

    // Assign skills to agents
    const agentSkills: Record<string, string[]> = {
      'EXEC-BRIEF-001': ['EXEC-SKILL-SUMMARIZATION', 'EXEC-SKILL-ANALYSIS', 'EXEC-SKILL-SCHEDULING'],
      'EXEC-STRAT-001': ['EXEC-SKILL-STRATEGIC-PLANNING', 'EXEC-SKILL-ANALYSIS', 'EXEC-SKILL-RISK-ASSESSMENT', 'EXEC-SKILL-REASONING'],
      'EXEC-PORT-001': ['EXEC-SKILL-PORTFOLIO-MGMT', 'EXEC-SKILL-ANALYSIS', 'EXEC-SKILL-SCHEDULING', 'EXEC-SKILL-DECISION-SUPPORT'],
      'EXEC-RISK-001': ['EXEC-SKILL-RISK-ASSESSMENT', 'EXEC-SKILL-GOVERNANCE', 'EXEC-SKILL-ANALYSIS', 'EXEC-SKILL-REASONING'],
      'EXEC-MEET-001': ['EXEC-SKILL-MEETING-INTELLIGENCE', 'EXEC-SKILL-SUMMARIZATION', 'EXEC-SKILL-SCHEDULING', 'EXEC-SKILL-COMMUNICATION'],
      'EXEC-COMMS-001': ['EXEC-SKILL-COMMUNICATION', 'EXEC-SKILL-WRITING', 'EXEC-SKILL-PLANNING'],
    };

    for (const [agentId, skills] of Object.entries(agentSkills)) {
      for (const skillId of skills) {
        this.workforce.assignSkillToAgent(agentId, skillId, 0.9);
      }
    }

    // Set collaboration rules
    for (const rule of EXECUTIVE_COLLAB_RULES) {
      this.workforce.setCollaborationRule(rule);
    }

    // Add office policies
    for (const policy of EXECUTIVE_POLICIES) {
      this.workforce.addPolicy(policy);
    }
  }

  getAgent(agentId: string) { return this.workforce.getAgent(agentId); }
  listAgents() { return this.workforce.listAgentsByOffice('Executive Office'); }
}
