import { describe, it, expect, beforeEach } from 'vitest';
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import type { AgentIdentity, Skill, WorkforceMessage, Task, CollaborationRule, HumanCollaborationRequest, AgentMetrics, PerformanceGoal, WorkforcePolicy, AgentLifecycleEvent } from '../../lib/workforce/types';

describe('EVDP-002 — AI Workforce Platform', () => {
  let platform: WorkforcePlatformImpl;

  const execAgent: AgentIdentity = {
    agentId: 'EO-001', name: 'Executive Briefing Agent', office: 'Executive Office',
    role: 'Briefing Agent', manager: null, capabilities: ['summarization', 'analysis'],
    authorityLevel: 'advisory', securityClassification: 'executive', status: 'active',
    version: '1.0.0', owner: 'CEO Office', createdAt: 0, updatedAt: 0,
  };

  const researchAgent: AgentIdentity = {
    agentId: 'RO-001', name: 'Research Collection Agent', office: 'Research Office',
    role: 'Research Agent', manager: 'EO-001', capabilities: ['research', 'analysis'],
    authorityLevel: 'operational', securityClassification: 'internal', status: 'active',
    version: '1.0.0', owner: 'Research Lead', createdAt: 0, updatedAt: 0,
  };

  beforeEach(() => { platform = new WorkforcePlatformImpl(); });

  // ── Workstream A: Identity ──

  describe('A — Workforce Identity', () => {
    it('registers an agent with full identity', () => {
      platform.registerAgent(execAgent);
      const agent = platform.getAgent('EO-001');
      expect(agent).toBeDefined();
      expect(agent!.name).toBe('Executive Briefing Agent');
      expect(agent!.authorityLevel).toBe('advisory');
    });

    it('rejects duplicate agent registration', () => {
      platform.registerAgent(execAgent);
      expect(() => platform.registerAgent(execAgent)).toThrow('Agent already registered');
    });

    it('updates agent status', () => {
      platform.registerAgent(execAgent);
      platform.updateAgentStatus('EO-001', 'suspended');
      expect(platform.getAgent('EO-001')!.status).toBe('suspended');
    });

    it('updates agent manager', () => {
      platform.registerAgent(execAgent);
      platform.updateAgentManager('EO-001', 'CEO');
      expect(platform.getAgent('EO-001')!.manager).toBe('CEO');
    });

    it('lists agents by office', () => {
      platform.registerAgent(execAgent);
      platform.registerAgent(researchAgent);
      const execs = platform.listAgentsByOffice('Executive Office');
      expect(execs.length).toBe(1);
      expect(execs[0].agentId).toBe('EO-001');
    });

    it('lists all agents', () => {
      platform.registerAgent(execAgent);
      platform.registerAgent(researchAgent);
      expect(platform.listAllAgents().length).toBe(2);
    });

    it('throws on status update for unknown agent', () => {
      expect(() => platform.updateAgentStatus('unknown', 'inactive')).toThrow('Agent not found');
    });
  });

  // ── Workstream B: Skills ──

  describe('B — Skills & Capability Registry', () => {
    const skill: Skill = {
      skillId: 'SKILL-RESEARCH-001', name: 'Market Research', category: 'Research',
      version: '1.0.0', description: 'Conduct systematic market research',
      requiresApproval: false, relatedSkills: ['SKILL-ANALYSIS-001'],
    };

    it('registers a skill', () => {
      platform.registerSkill(skill);
      expect(platform.getSkill('SKILL-RESEARCH-001')!.name).toBe('Market Research');
    });

    it('rejects duplicate skill registration', () => {
      platform.registerSkill(skill);
      expect(() => platform.registerSkill(skill)).toThrow('Skill already registered');
    });

    it('assigns skill to agent', () => {
      platform.registerAgent(execAgent);
      platform.registerSkill(skill);
      platform.assignSkillToAgent('EO-001', 'SKILL-RESEARCH-001', 0.85);
      const skills = platform.getAgentSkills('EO-001');
      expect(skills.length).toBe(1);
      expect(skills[0].proficiency).toBe(0.85);
    });

    it('removes skill from agent', () => {
      platform.registerAgent(execAgent);
      platform.registerSkill(skill);
      platform.assignSkillToAgent('EO-001', 'SKILL-RESEARCH-001', 0.85);
      platform.removeSkillFromAgent('EO-001', 'SKILL-RESEARCH-001');
      expect(platform.getAgentSkills('EO-001').length).toBe(0);
    });

    it('finds agents by skill and minimum proficiency', () => {
      platform.registerAgent(execAgent);
      platform.registerAgent(researchAgent);
      platform.registerSkill(skill);
      platform.assignSkillToAgent('EO-001', 'SKILL-RESEARCH-001', 0.7);
      platform.assignSkillToAgent('RO-001', 'SKILL-RESEARCH-001', 0.9);
      const agents = platform.findAgentsBySkill('SKILL-RESEARCH-001', 0.8);
      expect(agents.length).toBe(1);
      expect(agents[0]).toBe('RO-001');
    });

    it('lists all skills', () => {
      platform.registerSkill(skill);
      expect(platform.listAllSkills().length).toBe(1);
    });
  });

  // ── Workstream C: Communications ──

  describe('C — Workforce Communications', () => {
    it('sends and retrieves messages', () => {
      const msg: WorkforceMessage = {
        messageId: '', type: 'request', sender: 'EO-001', recipient: 'RO-001',
        payload: { query: 'data' }, timestamp: 0, correlationId: 'conv-1',
        auditRef: 'audit-1', priority: 3,
      };
      platform.sendMessage(msg);
      const inbox = platform.getAgentInbox('RO-001');
      expect(inbox.length).toBe(1);
    });

    it('retrieves agent outbox', () => {
      platform.sendMessage({ messageId: '', type: 'response', sender: 'EO-001', recipient: 'RO-001', payload: {}, timestamp: 0, correlationId: 'conv-1', auditRef: 'audit-1', priority: 1 });
      expect(platform.getAgentOutbox('EO-001').length).toBe(1);
    });

    it('retrieves full conversation by correlationId', () => {
      platform.sendMessage({ messageId: '', type: 'request', sender: 'EO-001', recipient: 'RO-001', payload: {}, timestamp: 0, correlationId: 'conv-1', auditRef: 'a1', priority: 1 });
      platform.sendMessage({ messageId: '', type: 'response', sender: 'RO-001', recipient: 'EO-001', payload: {}, timestamp: 0, correlationId: 'conv-1', auditRef: 'a2', priority: 1 });
      const conv = platform.getConversation('conv-1');
      expect(conv.length).toBe(2);
    });

    it('filters conversations by type for an agent', () => {
      platform.sendMessage({ messageId: '', type: 'request', sender: 'EO-001', recipient: 'RO-001', payload: {}, timestamp: 0, correlationId: 'c1', auditRef: 'a1', priority: 1 });
      platform.sendMessage({ messageId: '', type: 'exception', sender: 'RO-001', recipient: 'EO-001', payload: {}, timestamp: 0, correlationId: 'c2', auditRef: 'a2', priority: 1 });
      expect(platform.getConversationByType('EO-001', 'request').length).toBe(1);
      expect(platform.getConversationByType('EO-001', 'exception').length).toBe(1);
    });
  });

  // ── Workstream D: Task Lifecycle ──

  describe('D — Task Lifecycle', () => {
    it('creates a task with audit trail', () => {
      const task: Task = {
        taskId: '', type: 'research', summary: 'Collect data', assignedTo: 'RO-001',
        assignedBy: 'EO-001', status: 'created', priority: 3, dependencies: [],
        humanApprovalRequired: false, created: 0, accepted: null, completed: null, auditTrail: [],
      };
      platform.createTask(task);
      const tasks = platform.getAgentTasks('RO-001');
      expect(tasks.length).toBe(1);
      expect(tasks[0].auditTrail.length).toBe(1);
      expect(tasks[0].auditTrail[0].action).toBe('created');
    });

    it('accepts a task', () => {
      const task: Task = {
        taskId: '', type: 'research', summary: 'Collect data', assignedTo: 'RO-001',
        assignedBy: 'EO-001', status: 'created', priority: 3, dependencies: [],
        humanApprovalRequired: false, created: 0, accepted: null, completed: null, auditTrail: [],
      };
      platform.createTask(task);
      const taskId = platform.getAgentTasks('RO-001')[0].taskId;
      platform.acceptTask(taskId, 'RO-001');
      expect(platform.getTask(taskId)!.status).toBe('accepted');
      expect(platform.getTask(taskId)!.accepted).toBeGreaterThan(0);
    });

    it('updates task status through lifecycle', () => {
      const task: Task = {
        taskId: '', type: 'research', summary: 'Collect data', assignedTo: 'RO-001',
        assignedBy: 'EO-001', status: 'created', priority: 3, dependencies: [],
        humanApprovalRequired: false, created: 0, accepted: null, completed: null, auditTrail: [],
      };
      platform.createTask(task);
      const taskId = platform.getAgentTasks('RO-001')[0].taskId;
      platform.acceptTask(taskId, 'RO-001');
      platform.updateTaskStatus(taskId, 'planning', 'RO-001', 'Planning phase');
      platform.updateTaskStatus(taskId, 'executing', 'RO-001', 'Executing');
      platform.updateTaskStatus(taskId, 'review', 'RO-001', 'Ready for review');
      platform.updateTaskStatus(taskId, 'completed', 'RO-001', 'Done');
      expect(platform.getTask(taskId)!.status).toBe('completed');
      expect(platform.getTask(taskId)!.completed).toBeGreaterThan(0);
      expect(platform.getTask(taskId)!.auditTrail.length).toBe(6);
    });

    it('gets agent tasks', () => {
      const task: Task = {
        taskId: '', type: 'research', summary: 'Collect data', assignedTo: 'RO-001',
        assignedBy: 'EO-001', status: 'created', priority: 3, dependencies: [],
        humanApprovalRequired: false, created: 0, accepted: null, completed: null, auditTrail: [],
      };
      platform.createTask(task);
      expect(platform.getAgentTasks('RO-001').length).toBe(1);
      expect(platform.getAgentTasks('EO-001').length).toBe(0);
    });

    it('gets tasks by status', () => {
      const task: Task = {
        taskId: '', type: 'research', summary: 'Collect data', assignedTo: 'RO-001',
        assignedBy: 'EO-001', status: 'created', priority: 3, dependencies: [],
        humanApprovalRequired: false, created: 0, accepted: null, completed: null, auditTrail: [],
      };
      platform.createTask(task);
      expect(platform.getTasksByStatus('created').length).toBe(1);
      expect(platform.getTasksByStatus('completed').length).toBe(0);
    });
  });

  // ── Workstream E: Human Collaboration ──

  describe('E — Human Collaboration', () => {
    it('sets and retrieves collaboration rules', () => {
      const rule: CollaborationRule = { actionType: 'publish-content', defaultMode: 'act-autonomously', escalateAfterMs: 3600000 };
      platform.setCollaborationRule(rule);
      expect(platform.getCollaborationMode('publish-content')!.defaultMode).toBe('act-autonomously');
    });

    it('requests and resolves human review', () => {
      const request: HumanCollaborationRequest = {
        requestId: '', agentId: 'EO-001', actionType: 'publish-content',
        context: { draft: 'content' }, mode: 'recommend',
        requestedAt: 0, resolvedAt: null, resolution: null, resolvedBy: null,
      };
      platform.requestHumanReview(request);
      expect(platform.getPendingHumanReviews().length).toBe(1);
      platform.resolveHumanReview(platform.getPendingHumanReviews()[0].requestId, 'approved', 'CEO');
      expect(platform.getPendingHumanReviews().length).toBe(0);
    });

    it('prevents double resolution', () => {
      platform.requestHumanReview({ requestId: '', agentId: 'EO-001', actionType: 'test', context: {}, mode: 'recommend', requestedAt: 0, resolvedAt: null, resolution: null, resolvedBy: null });
      const id = platform.getPendingHumanReviews()[0].requestId;
      platform.resolveHumanReview(id, 'approved', 'CEO');
      expect(() => platform.resolveHumanReview(id, 'denied', 'CEO')).toThrow('Review already resolved');
    });

    it('filters pending reviews by agent', () => {
      platform.requestHumanReview({ requestId: '', agentId: 'EO-001', actionType: 'a', context: {}, mode: 'recommend', requestedAt: 0, resolvedAt: null, resolution: null, resolvedBy: null });
      platform.requestHumanReview({ requestId: '', agentId: 'RO-001', actionType: 'b', context: {}, mode: 'recommend', requestedAt: 0, resolvedAt: null, resolution: null, resolvedBy: null });
      expect(platform.getPendingHumanReviews('EO-001').length).toBe(1);
    });

    it('retrieves human review history for an agent', () => {
      platform.requestHumanReview({ requestId: '', agentId: 'EO-001', actionType: 'a', context: {}, mode: 'recommend', requestedAt: 0, resolvedAt: null, resolution: null, resolvedBy: null });
      const id = platform.getPendingHumanReviews('EO-001')[0].requestId;
      platform.resolveHumanReview(id, 'approved', 'CEO');
      expect(platform.getHumanReviewHistory('EO-001').length).toBe(1);
      expect(platform.getHumanReviewHistory('EO-001')[0].resolution).toBe('approved');
    });
  });

  // ── Workstream F: Performance ──

  describe('F — Performance & Learning', () => {
    it('records and retrieves metrics', () => {
      const metrics: AgentMetrics = {
        agentId: 'EO-001', periodStart: 1710000000000, periodEnd: 1710400000000,
        tasksCompleted: 50, averageResponseTimeMs: 3000, qualityScore: 0.95,
        escalationFrequency: 0.02, collaborationEffectiveness: 0.90,
        utilization: 0.80, governanceCompliance: 0.99,
      };
      platform.recordMetrics(metrics);
      const retrieved = platform.getAgentMetrics('EO-001', 1710000000000, 1710400000000);
      expect(retrieved).toBeDefined();
      expect(retrieved!.qualityScore).toBe(0.95);
    });

    it('returns undefined for agent with no metrics', () => {
      expect(platform.getAgentMetrics('unknown', 0, Date.now())).toBeUndefined();
    });

    it('sets and gets performance goals', () => {
      const goal: PerformanceGoal = { metric: 'qualityScore', target: 0.90, weight: 0.5 };
      platform.setPerformanceGoal('EO-001', goal);
      expect(platform.getPerformanceGoals('EO-001').length).toBe(1);
      expect(platform.getPerformanceGoals('EO-001')[0].target).toBe(0.90);
    });
  });

  // ── Workstream G: Governance ──

  describe('G — Workforce Governance', () => {
    it('adds and evaluates policies', () => {
      const policy: WorkforcePolicy = {
        policyId: 'WP-001', name: 'Advisory Cannot Deploy', scope: 'identity',
        effect: 'deny', condition: "authorityLevel == 'advisory'", description: '',
      };
      platform.addPolicy(policy);
      expect(platform.evaluatePolicy('identity', { authorityLevel: 'advisory' })).toBe('deny');
    });

    it('returns allow for scopes with no policies', () => {
      expect(platform.evaluatePolicy('tasks', {})).toBe('allow');
    });

    it('lists policies by scope', () => {
      platform.addPolicy({ policyId: 'WP-001', name: 'P1', scope: 'identity', effect: 'deny', condition: '', description: '' });
      platform.addPolicy({ policyId: 'WP-002', name: 'P2', scope: 'skills', effect: 'allow', condition: '', description: '' });
      expect(platform.listPolicies('identity').length).toBe(1);
      expect(platform.listPolicies().length).toBe(2);
    });

    it('records and retrieves lifecycle events', () => {
      const event: AgentLifecycleEvent = {
        eventId: '', agentId: 'EO-001', eventType: 'onboarded',
        timestamp: 0, performedBy: 'AI-Ops', detail: 'Initial deployment',
      };
      platform.recordLifecycleEvent(event);
      const events = platform.getAgentLifecycle('EO-001');
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe('onboarded');
    });

    it('returns empty lifecycle for unknown agent', () => {
      expect(platform.getAgentLifecycle('unknown').length).toBe(0);
    });
  });

  // ── Configuration Validation ──

  describe('Configuration Validation', () => {
    it('reports registered agents count', () => {
      platform.registerAgent(execAgent);
      platform.registerAgent(researchAgent);
      expect(platform.listAllAgents().length).toBe(2);
    });

    it('reports registered skills count', () => {
      platform.registerSkill({ skillId: 'S1', name: 'Research', category: 'R', version: '1.0', description: '', requiresApproval: false, relatedSkills: [] });
      platform.registerSkill({ skillId: 'S2', name: 'Writing', category: 'W', version: '1.0', description: '', requiresApproval: false, relatedSkills: [] });
      expect(platform.listAllSkills().length).toBe(2);
    });

    it('reports policies count', () => {
      platform.addPolicy({ policyId: 'P1', name: '', scope: 'identity', effect: 'deny', condition: '', description: '' });
      platform.addPolicy({ policyId: 'P2', name: '', scope: 'skills', effect: 'allow', condition: '', description: '' });
      platform.addPolicy({ policyId: 'P3', name: '', scope: 'tasks', effect: 'require-approval', condition: '', description: '' });
      expect(platform.listPolicies().length).toBe(3);
    });
  });
});
