import { describe, it, expect, beforeEach } from 'vitest';
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { ProductOffice } from '../../lib/product-office/product-office';

describe('EVDP-005 — Product Office Deployment', () => {
  let workforce: WorkforcePlatformImpl;
  let office: ProductOffice;

  beforeEach(() => {
    workforce = new WorkforcePlatformImpl();
    office = new ProductOffice(workforce);
    office.deploy();
  });

  // ── 5.1 — All Five Agents Deployed ──

  describe('5.1 — Agent Identity', () => {
    it('deploys all 5 product agents', () => {
      const agents = office.listAgents();
      expect(agents.length).toBe(5);
    });

    it('deploys Roadmap Coordinator Agent', () => {
      const agent = office.getAgent('PROD-RMAP-001');
      expect(agent).toBeDefined();
      expect(agent!.role).toBe('Roadmap Coordinator Agent');
      expect(agent!.authorityLevel).toBe('operational');
    });

    it('deploys Capability Registry Agent', () => {
      const agent = office.getAgent('PROD-CAP-001');
      expect(agent).toBeDefined();
      expect(agent!.capabilities).toContain('product.capability-registry');
      expect(agent!.authorityLevel).toBe('advisory');
    });

    it('deploys Release Planner Agent', () => {
      const agent = office.getAgent('PROD-REL-001');
      expect(agent).toBeDefined();
      expect(agent!.capabilities).toContain('product.release-planning');
    });

    it('deploys Feature Prioritization Agent', () => {
      const agent = office.getAgent('PROD-PRI-001');
      expect(agent).toBeDefined();
      expect(agent!.capabilities).toContain('product.prioritization');
    });

    it('deploys Dependency Tracker Agent', () => {
      const agent = office.getAgent('PROD-DEP-001');
      expect(agent).toBeDefined();
      expect(agent!.capabilities).toContain('product.dependency-tracking');
      expect(agent!.authorityLevel).toBe('operational');
    });
  });

  // ── 5.2 — Skills & Capabilities ──

  describe('5.2 — Skills & Capabilities', () => {
    it('registers all 11 product skills', () => {
      expect(workforce.listAllSkills().length).toBe(11);
    });

    it('assigns 3 skills to roadmap coordinator', () => {
      const skills = workforce.getAgentSkills('PROD-RMAP-001');
      expect(skills.length).toBe(3);
      expect(skills.some(s => s.skillId === 'PROD-SKILL-ROADMAP-MGMT')).toBe(true);
    });

    it('assigns 2 skills to capability registry agent', () => {
      expect(workforce.getAgentSkills('PROD-CAP-001').length).toBe(2);
    });

    it('assigns 3 skills to release planner', () => {
      expect(workforce.getAgentSkills('PROD-REL-001').length).toBe(3);
    });

    it('assigns 3 skills to prioritization agent', () => {
      expect(workforce.getAgentSkills('PROD-PRI-001').length).toBe(3);
    });

    it('assigns 3 skills to dependency tracker', () => {
      expect(workforce.getAgentSkills('PROD-DEP-001').length).toBe(3);
    });

    it('finds agents with prioritization skill', () => {
      const agents = workforce.findAgentsBySkill('PROD-SKILL-PRIORITIZATION', 0.8);
      expect(agents).toContain('PROD-PRI-001');
    });
  });

  // ── 5.3 — Collaboration Rules ──

  describe('5.3 — Collaboration Rules', () => {
    it('sets autonomous mode for roadmap collection', () => {
      const rule = workforce.getCollaborationMode('collect-roadmap-updates');
      expect(rule).toBeDefined();
      expect(rule!.defaultMode).toBe('act-autonomously');
    });

    it('sets recommend mode for roadmap changes', () => {
      const rule = workforce.getCollaborationMode('propose-roadmap-change');
      expect(rule!.defaultMode).toBe('recommend');
      expect(rule!.escalateAfterMs).toBe(7 * 86400000);
    });

    it('sets inform mode for capability consolidation recommendations', () => {
      const rule = workforce.getCollaborationMode('recommend-capability-consolidation');
      expect(rule!.defaultMode).toBe('inform');
    });

    it('sets recommend mode for release planning', () => {
      const rule = workforce.getCollaborationMode('plan-release-schedule');
      expect(rule!.defaultMode).toBe('recommend');
      expect(rule!.escalateAfterMs).toBe(14 * 86400000);
    });

    it('sets inform mode for feature prioritization', () => {
      const rule = workforce.getCollaborationMode('prioritize-features');
      expect(rule!.defaultMode).toBe('inform');
    });

    it('sets autonomous mode for dependency tracking', () => {
      const rule = workforce.getCollaborationMode('track-dependencies');
      expect(rule!.defaultMode).toBe('act-autonomously');
    });
  });

  // ── 5.4 — Governance Policies ──

  describe('5.4 — Governance Policies', () => {
    it('applies 4 product office policies', () => {
      expect(workforce.listPolicies().length).toBe(4);
    });

    it('denies stale capability registrations (P-001)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'product.capability-registry', daysSinceUpdate: 45 });
      expect(effect).toBe('deny');
    });

    it('allows current capability registrations (P-001)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'product.capability-registry', daysSinceUpdate: 15 });
      expect(effect).toBe('allow');
    });

    it('requires approval for cross-product dependency changes (P-002)', () => {
      const effect = workforce.evaluatePolicy('tasks', { actionType: 'change-dependency', affectedProducts: 2 });
      expect(effect).toBe('require-approval');
    });

    it('allows single-product dependency changes (P-002)', () => {
      const effect = workforce.evaluatePolicy('tasks', { actionType: 'change-dependency', affectedProducts: 1 });
      expect(effect).toBe('allow');
    });

    it('denies prioritization without confidence score (P-003)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'product.prioritization', confidenceScore: null, dataSources: ['analytics'] });
      expect(effect).toBe('deny');
    });

    it('denies prioritization without data sources (P-003)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'product.prioritization', confidenceScore: 0.85, dataSources: null });
      expect(effect).toBe('deny');
    });

    it('allows prioritization with both confidence and sources (P-003)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'product.prioritization', confidenceScore: 0.85, dataSources: ['analytics', 'user-survey'] });
      expect(effect).toBe('allow');
    });

    it('requires approval for out-of-scope roadmap changes (P-004)', () => {
      const effect = workforce.evaluatePolicy('collaboration', { actionType: 'propose-roadmap-change', outsideApprovedScope: true });
      expect(effect).toBe('require-approval');
    });

    it('allows in-scope roadmap changes (P-004)', () => {
      const effect = workforce.evaluatePolicy('collaboration', { actionType: 'propose-roadmap-change', outsideApprovedScope: false });
      expect(effect).toBe('allow');
    });
  });

  // ── 5.5 — Lifecycle Events ──

  describe('5.5 — Lifecycle Events', () => {
    it('records onboarding for all 5 agents', () => {
      for (const agent of office.listAgents()) {
        const events = workforce.getAgentLifecycle(agent.agentId);
        expect(events.length).toBe(1);
        expect(events[0].eventType).toBe('onboarded');
        expect(events[0].performedBy).toBe('EVDP-005');
      }
    });
  });

  // ── 5.6 — Product Communications ──

  describe('5.6 — Product Communications', () => {
    it('roadmap coordinator can receive roadmap updates', () => {
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'Director of Product', recipient: 'PROD-RMAP-001',
        payload: { command: 'collect-roadmap-updates', product: 'MenWise360' }, timestamp: 0,
        correlationId: 'prod-demo-1', auditRef: 'audit-product', priority: 3,
      });
      const inbox = workforce.getAgentInbox('PROD-RMAP-001');
      expect(inbox.length).toBe(1);
      expect(inbox[0].payload).toHaveProperty('product');
    });

    it('capability registry agent can flag duplicate capabilities', () => {
      workforce.sendMessage({
        messageId: '', type: 'response', sender: 'PROD-CAP-001', recipient: 'Director of Product',
        payload: { notification: 'Capability duplication detected: user-auth in 3 products', severity: 'consolidation-recommended' }, timestamp: 0,
        correlationId: 'prod-demo-2', auditRef: 'audit-product', priority: 3,
      });
      const inbox = workforce.getAgentInbox('Director of Product');
      const notifications = inbox.filter(m => m.correlationId === 'prod-demo-2');
      expect(notifications.length).toBe(1);
    });

    it('release planner can propose release schedule', () => {
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'Director of Product', recipient: 'PROD-REL-001',
        payload: { command: 'plan-release-schedule', products: ['MenWise360', 'Bible Quest'] }, timestamp: 0,
        correlationId: 'prod-demo-3', auditRef: 'audit-product', priority: 3,
      });
      workforce.sendMessage({
        messageId: '', type: 'response', sender: 'PROD-REL-001', recipient: 'Director of Product',
        payload: { proposedDate: '2026-08-15', conflicts: [], confidence: 0.88 }, timestamp: 0,
        correlationId: 'prod-demo-3', auditRef: 'audit-product', priority: 3,
      });
      const conv = workforce.getConversation('prod-demo-3');
      expect(conv.length).toBe(2);
    });

    it('prioritization agent can recommend feature priorities', () => {
      workforce.sendMessage({
        messageId: '', type: 'response', sender: 'PROD-PRI-001', recipient: 'Director of Product',
        payload: { priority: 'high', feature: 'onboarding-flow', valueRatio: 3.2, confidenceScore: 0.85, dataSources: ['analytics'] }, timestamp: 0,
        correlationId: 'prod-demo-4', auditRef: 'audit-product', priority: 3,
      });
      const inbox = workforce.getAgentInbox('Director of Product');
      const recommendations = inbox.filter(m => m.correlationId === 'prod-demo-4');
      expect(recommendations.length).toBe(1);
      expect(recommendations[0].payload).toHaveProperty('confidenceScore');
    });

    it('dependency tracker can alert breaking changes', () => {
      workforce.sendMessage({
        messageId: '', type: 'escalation', sender: 'PROD-DEP-001', recipient: 'Director of Product',
        payload: { alert: 'breaking-change', dependency: 'auth-service', affectedProducts: ['MenWise360', 'Bible Quest', 'Creator Automation'], severity: 'critical' }, timestamp: 0,
        correlationId: 'prod-demo-5', auditRef: 'audit-product', priority: 5,
      });
      const inbox = workforce.getAgentInbox('Director of Product');
      const alerts = inbox.filter(m => m.correlationId === 'prod-demo-5');
      expect(alerts.length).toBe(1);
      expect(alerts[0].priority).toBe(5);
    });
  });

  // ── 5.7 — Cross-Office Integration ──

  describe('5.7 — Cross-Office Integration', () => {
    it('supports product lifecycle: roadmap → prioritize → release', () => {
      // Phase 1: Roadmap coordinator updates roadmap
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'Director of Product', recipient: 'PROD-RMAP-001',
        payload: { command: 'collect-roadmap-updates', product: 'Bible Quest' }, timestamp: 0,
        correlationId: 'lifecycle-prod', auditRef: 'audit-product-lifecycle', priority: 3,
      });
      // Phase 2: Prioritization agent scores features
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'Director of Product', recipient: 'PROD-PRI-001',
        payload: { command: 'prioritize-features', product: 'Bible Quest', confidenceScore: 0.9, dataSources: ['roadmap', 'analytics'] }, timestamp: 0,
        correlationId: 'lifecycle-prod', auditRef: 'audit-product-lifecycle', priority: 3,
      });
      // Phase 3: Release planner proposes schedule
      workforce.sendMessage({
        messageId: '', type: 'response', sender: 'PROD-REL-001', recipient: 'Director of Product',
        payload: { proposedDate: '2026-09-01', dependsOn: ['auth-service-update'] }, timestamp: 0,
        correlationId: 'lifecycle-prod', auditRef: 'audit-product-lifecycle', priority: 3,
      });
      const conv = workforce.getConversation('lifecycle-prod');
      expect(conv.length).toBe(3);
    });
  });
});
