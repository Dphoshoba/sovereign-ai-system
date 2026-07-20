import { describe, it, expect, beforeEach } from 'vitest';
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { OperationsOffice } from '../../lib/operations-office/operations-office';

describe('EVDP-006 — Operations Office Deployment', () => {
  let workforce: WorkforcePlatformImpl;
  let office: OperationsOffice;

  beforeEach(() => {
    workforce = new WorkforcePlatformImpl();
    office = new OperationsOffice(workforce);
    office.deploy();
  });

  // ── 6.1 — All Five Agents Deployed ──

  describe('6.1 — Agent Identity', () => {
    it('deploys all 5 operations agents', () => {
      const agents = office.listAgents();
      expect(agents.length).toBe(5);
    });

    it('deploys Review Coordinator Agent', () => {
      const agent = office.getAgent('OPS-REV-001');
      expect(agent).toBeDefined();
      expect(agent!.role).toBe('Review Coordinator Agent');
      expect(agent!.authorityLevel).toBe('operational');
    });

    it('deploys Project Tracker Agent', () => {
      const agent = office.getAgent('OPS-PROJ-001');
      expect(agent).toBeDefined();
      expect(agent!.capabilities).toContain('operations.project-tracking');
      expect(agent!.authorityLevel).toBe('operational');
    });

    it('deploys Documentation Agent', () => {
      const agent = office.getAgent('OPS-DOC-001');
      expect(agent).toBeDefined();
      expect(agent!.capabilities).toContain('operations.documentation');
      expect(agent!.authorityLevel).toBe('advisory');
    });

    it('deploys Deployment Readiness Agent', () => {
      const agent = office.getAgent('OPS-DEPLOY-001');
      expect(agent).toBeDefined();
      expect(agent!.capabilities).toContain('operations.deployment-readiness');
    });

    it('deploys Compliance Monitor Agent', () => {
      const agent = office.getAgent('OPS-COMP-001');
      expect(agent).toBeDefined();
      expect(agent!.capabilities).toContain('operations.compliance');
    });
  });

  // ── 6.2 — Skills & Capabilities ──

  describe('6.2 — Skills & Capabilities', () => {
    it('registers all 11 operations skills', () => {
      expect(workforce.listAllSkills().length).toBe(11);
    });

    it('assigns 3 skills to review coordinator', () => {
      const skills = workforce.getAgentSkills('OPS-REV-001');
      expect(skills.length).toBe(3);
      expect(skills.some(s => s.skillId === 'OPS-SKILL-REVIEW-COORDINATION')).toBe(true);
    });

    it('assigns 3 skills to project tracker', () => {
      expect(workforce.getAgentSkills('OPS-PROJ-001').length).toBe(3);
    });

    it('assigns 2 skills to documentation agent', () => {
      expect(workforce.getAgentSkills('OPS-DOC-001').length).toBe(2);
    });

    it('assigns 3 skills to deployment readiness agent', () => {
      expect(workforce.getAgentSkills('OPS-DEPLOY-001').length).toBe(3);
    });

    it('assigns 3 skills to compliance monitor', () => {
      expect(workforce.getAgentSkills('OPS-COMP-001').length).toBe(3);
    });

    it('finds agents with compliance monitoring skill', () => {
      const agents = workforce.findAgentsBySkill('OPS-SKILL-COMPLIANCE-MONITORING', 0.8);
      expect(agents).toContain('OPS-COMP-001');
    });
  });

  // ── 6.3 — Collaboration Rules ──

  describe('6.3 — Collaboration Rules', () => {
    it('sets autonomous mode for review scheduling', () => {
      const rule = workforce.getCollaborationMode('schedule-operational-review');
      expect(rule).toBeDefined();
      expect(rule!.defaultMode).toBe('act-autonomously');
    });

    it('sets inform mode for overdue review flags', () => {
      const rule = workforce.getCollaborationMode('flag-overdue-review');
      expect(rule!.defaultMode).toBe('inform');
    });

    it('sets autonomous mode for project tracking', () => {
      const rule = workforce.getCollaborationMode('track-project-progress');
      expect(rule!.defaultMode).toBe('act-autonomously');
    });

    it('sets inform mode for at-risk escalation', () => {
      const rule = workforce.getCollaborationMode('escalate-at-risk-project');
      expect(rule!.defaultMode).toBe('inform');
    });

    it('sets recommend mode for resource reallocation', () => {
      const rule = workforce.getCollaborationMode('propose-resource-reallocation');
      expect(rule!.defaultMode).toBe('recommend');
      expect(rule!.escalateAfterMs).toBe(7 * 86400000);
    });

    it('sets autonomous mode for deployment readiness checks', () => {
      const rule = workforce.getCollaborationMode('check-deployment-readiness');
      expect(rule!.defaultMode).toBe('act-autonomously');
    });

    it('sets autonomous mode for compliance assessment', () => {
      const rule = workforce.getCollaborationMode('assess-compliance');
      expect(rule!.defaultMode).toBe('act-autonomously');
    });
  });

  // ── 6.4 — Governance Policies ──

  describe('6.4 — Governance Policies', () => {
    it('applies 5 operations office policies', () => {
      expect(workforce.listPolicies().length).toBe(5);
    });

    it('denies reviews without defined cadence (O-001)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'operations.review-coordination', reviewCadenceDays: null });
      expect(effect).toBe('deny');
    });

    it('allows reviews with defined cadence (O-001)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'operations.review-coordination', reviewCadenceDays: 30 });
      expect(effect).toBe('allow');
    });

    it('requires approval for projects 2+ weeks behind (O-002)', () => {
      const effect = workforce.evaluatePolicy('tasks', { actionType: 'delay-project', weeksBehind: 2 });
      expect(effect).toBe('require-approval');
    });

    it('allows projects less than 2 weeks behind (O-002)', () => {
      const effect = workforce.evaluatePolicy('tasks', { actionType: 'delay-project', weeksBehind: 1 });
      expect(effect).toBe('allow');
    });

    it('denies deployment when not all gates passed (O-003)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'operations.deployment-readiness', gatesPassed: 3, totalGates: 5 });
      expect(effect).toBe('deny');
    });

    it('allows deployment when all gates passed (O-003)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'operations.deployment-readiness', gatesPassed: 5, totalGates: 5 });
      expect(effect).toBe('allow');
    });

    it('requires approval for violation acknowledgement after 7 days (O-004)', () => {
      const effect = workforce.evaluatePolicy('tasks', { actionType: 'acknowledge-violation', daysSinceViolation: 10 });
      expect(effect).toBe('require-approval');
    });

    it('allows violation acknowledgement within 7 days (O-004)', () => {
      const effect = workforce.evaluatePolicy('tasks', { actionType: 'acknowledge-violation', daysSinceViolation: 5 });
      expect(effect).toBe('allow');
    });

    it('denies stale documentation beyond 90 days (O-005)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'operations.documentation', daysSinceUpdate: 120 });
      expect(effect).toBe('deny');
    });

    it('allows documentation within 90-day window (O-005)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'operations.documentation', daysSinceUpdate: 60 });
      expect(effect).toBe('allow');
    });
  });

  // ── 6.5 — Lifecycle Events ──

  describe('6.5 — Lifecycle Events', () => {
    it('records onboarding for all 5 agents', () => {
      for (const agent of office.listAgents()) {
        const events = workforce.getAgentLifecycle(agent.agentId);
        expect(events.length).toBe(1);
        expect(events[0].eventType).toBe('onboarded');
        expect(events[0].performedBy).toBe('EVDP-006');
      }
    });
  });

  // ── 6.6 — Operations Communications ──

  describe('6.6 — Operations Communications', () => {
    it('review coordinator can schedule reviews', () => {
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'Director of Operations', recipient: 'OPS-REV-001',
        payload: { command: 'schedule-operational-review', workstream: 'Product Office' }, timestamp: 0,
        correlationId: 'ops-demo-1', auditRef: 'audit-ops', priority: 3,
      });
      const inbox = workforce.getAgentInbox('OPS-REV-001');
      expect(inbox.length).toBe(1);
      expect(inbox[0].payload).toHaveProperty('workstream');
    });

    it('project tracker can escalate at-risk projects', () => {
      workforce.sendMessage({
        messageId: '', type: 'escalation', sender: 'OPS-PROJ-001', recipient: 'Director of Operations',
        payload: { escalation: 'Project behind schedule', project: 'Bible Quest Release', weeksBehind: 3, severity: 'high' }, timestamp: 0,
        correlationId: 'ops-demo-2', auditRef: 'audit-ops', priority: 4,
      });
      const inbox = workforce.getAgentInbox('Director of Operations');
      const escalations = inbox.filter(m => m.correlationId === 'ops-demo-2');
      expect(escalations.length).toBe(1);
      expect(escalations[0].priority).toBe(4);
    });

    it('documentation agent can flag stale content', () => {
      workforce.sendMessage({
        messageId: '', type: 'response', sender: 'OPS-DOC-001', recipient: 'Director of Operations',
        payload: { flag: 'stale-documentation', docId: 'OPS-RUNBOOK-001', daysSinceUpdate: 150, freshnessScore: 0.2 }, timestamp: 0,
        correlationId: 'ops-demo-3', auditRef: 'audit-ops', priority: 3,
      });
      const inbox = workforce.getAgentInbox('Director of Operations');
      const flags = inbox.filter(m => m.correlationId === 'ops-demo-3');
      expect(flags.length).toBe(1);
      expect(flags[0].payload).toHaveProperty('freshnessScore');
    });

    it('deployment readiness agent can check gates', () => {
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'Director of Operations', recipient: 'OPS-DEPLOY-001',
        payload: { command: 'check-deployment-readiness', product: 'MenWise360' }, timestamp: 0,
        correlationId: 'ops-demo-4', auditRef: 'audit-ops', priority: 3,
      });
      workforce.sendMessage({
        messageId: '', type: 'response', sender: 'OPS-DEPLOY-001', recipient: 'Director of Operations',
        payload: { readinessScore: 0.95, blockers: [], gatesPassed: 4, totalGates: 4 }, timestamp: 0,
        correlationId: 'ops-demo-4', auditRef: 'audit-ops', priority: 3,
      });
      const conv = workforce.getConversation('ops-demo-4');
      expect(conv.length).toBe(2);
    });

    it('compliance monitor can escalate violations', () => {
      workforce.sendMessage({
        messageId: '', type: 'escalation', sender: 'OPS-COMP-001', recipient: 'Director of Operations',
        payload: { violation: 'Policy O-003 breach', workstream: 'Product Office', daysUnacknowledged: 10, severity: 'critical' }, timestamp: 0,
        correlationId: 'ops-demo-5', auditRef: 'audit-ops', priority: 5,
      });
      const inbox = workforce.getAgentInbox('Director of Operations');
      const violations = inbox.filter(m => m.correlationId === 'ops-demo-5');
      expect(violations.length).toBe(1);
      expect(violations[0].priority).toBe(5);
    });
  });

  // ── 6.7 — Operations Lifecycle ──

  describe('6.7 — Operations Lifecycle', () => {
    it('supports operations workflow: review → project track → deploy', () => {
      // Phase 1: Review coordinator schedules review
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'Director of Operations', recipient: 'OPS-REV-001',
        payload: { command: 'schedule-operational-review', workstream: 'MenWise360', reviewCadenceDays: 30 }, timestamp: 0,
        correlationId: 'lifecycle-ops', auditRef: 'audit-ops-lifecycle', priority: 3,
      });
      // Phase 2: Project tracker reports progress
      workforce.sendMessage({
        messageId: '', type: 'response', sender: 'OPS-PROJ-001', recipient: 'Director of Operations',
        payload: { health: 'on-track', milestoneCompletion: 0.7 }, timestamp: 0,
        correlationId: 'lifecycle-ops', auditRef: 'audit-ops-lifecycle', priority: 3,
      });
      // Phase 3: Deployment readiness agent validates gates
      workforce.sendMessage({
        messageId: '', type: 'response', sender: 'OPS-DEPLOY-001', recipient: 'Director of Operations',
        payload: { readinessScore: 0.92, gatesPassed: 5, totalGates: 5 }, timestamp: 0,
        correlationId: 'lifecycle-ops', auditRef: 'audit-ops-lifecycle', priority: 3,
      });
      const conv = workforce.getConversation('lifecycle-ops');
      expect(conv.length).toBe(3);
    });
  });
});
