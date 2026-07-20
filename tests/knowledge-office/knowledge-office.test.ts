import { describe, it, expect, beforeEach } from 'vitest';
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { KnowledgeOffice } from '../../lib/knowledge-office/knowledge-office';

describe('EVDP-007 — Knowledge Office Deployment', () => {
  let workforce: WorkforcePlatformImpl;
  let office: KnowledgeOffice;

  beforeEach(() => {
    workforce = new WorkforcePlatformImpl();
    office = new KnowledgeOffice(workforce);
    office.deploy();
  });

  // ── 7.1 — All Four Agents Deployed ──

  describe('7.1 — Agent Identity', () => {
    it('deploys all 4 knowledge agents', () => {
      const agents = office.listAgents();
      expect(agents.length).toBe(4);
    });

    it('deploys Knowledge Curation Agent', () => {
      const agent = office.getAgent('KNOW-CUR-001');
      expect(agent).toBeDefined();
      expect(agent!.role).toBe('Knowledge Curation Agent');
      expect(agent!.authorityLevel).toBe('advisory');
    });

    it('deploys Knowledge Search Agent', () => {
      const agent = office.getAgent('KNOW-SRCH-001');
      expect(agent).toBeDefined();
      expect(agent!.capabilities).toContain('knowledge.search');
      expect(agent!.authorityLevel).toBe('operational');
    });

    it('deploys Lessons Learned Agent', () => {
      const agent = office.getAgent('KNOW-LESS-001');
      expect(agent).toBeDefined();
      expect(agent!.capabilities).toContain('knowledge.lessons');
    });

    it('deploys Knowledge Health Agent', () => {
      const agent = office.getAgent('KNOW-HLTH-001');
      expect(agent).toBeDefined();
      expect(agent!.capabilities).toContain('knowledge.health');
    });
  });

  // ── 7.2 — Skills & Capabilities ──

  describe('7.2 — Skills & Capabilities', () => {
    it('registers all 10 knowledge skills', () => {
      expect(workforce.listAllSkills().length).toBe(10);
    });

    it('assigns 4 skills to curation agent', () => {
      const skills = workforce.getAgentSkills('KNOW-CUR-001');
      expect(skills.length).toBe(4);
      expect(skills.some(s => s.skillId === 'KNOW-SKILL-CURATION')).toBe(true);
      expect(skills.some(s => s.skillId === 'KNOW-SKILL-VERSIONING')).toBe(true);
    });

    it('assigns 3 skills to search agent', () => {
      expect(workforce.getAgentSkills('KNOW-SRCH-001').length).toBe(3);
    });

    it('assigns 3 skills to lessons learned agent', () => {
      expect(workforce.getAgentSkills('KNOW-LESS-001').length).toBe(3);
    });

    it('assigns 2 skills to health agent', () => {
      expect(workforce.getAgentSkills('KNOW-HLTH-001').length).toBe(2);
    });

    it('finds agents with curation skill', () => {
      const agents = workforce.findAgentsBySkill('KNOW-SKILL-CURATION', 0.8);
      expect(agents).toContain('KNOW-CUR-001');
    });
  });

  // ── 7.3 — Collaboration Rules ──

  describe('7.3 — Collaboration Rules', () => {
    it('sets recommend mode for knowledge ingestion', () => {
      const rule = workforce.getCollaborationMode('ingest-knowledge-entry');
      expect(rule).toBeDefined();
      expect(rule!.defaultMode).toBe('recommend');
      expect(rule!.escalateAfterMs).toBe(7 * 86400000);
    });

    it('sets autonomous mode for entry updates', () => {
      const rule = workforce.getCollaborationMode('update-existing-entry');
      expect(rule!.defaultMode).toBe('act-autonomously');
    });

    it('sets autonomous mode for knowledge search', () => {
      const rule = workforce.getCollaborationMode('search-knowledge');
      expect(rule!.defaultMode).toBe('act-autonomously');
    });

    it('sets inform mode for access violations', () => {
      const rule = workforce.getCollaborationMode('flag-access-violation');
      expect(rule!.defaultMode).toBe('inform');
    });

    it('sets recommend mode for lesson capture', () => {
      const rule = workforce.getCollaborationMode('capture-lesson');
      expect(rule!.defaultMode).toBe('recommend');
      expect(rule!.escalateAfterMs).toBe(14 * 86400000);
    });

    it('sets autonomous mode for health assessment', () => {
      const rule = workforce.getCollaborationMode('assess-knowledge-health');
      expect(rule!.defaultMode).toBe('act-autonomously');
    });
  });

  // ── 7.4 — Governance Policies ──

  describe('7.4 — Governance Policies', () => {
    it('applies 5 knowledge office policies', () => {
      expect(workforce.listPolicies().length).toBe(5);
    });

    it('denies entries without author metadata (K-001)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'knowledge.curation', author: null, source: 'research', topic: 'MenWise360' });
      expect(effect).toBe('deny');
    });

    it('denies entries without source metadata (K-001)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'knowledge.curation', author: 'AI Agent', source: null, topic: 'MenWise360' });
      expect(effect).toBe('deny');
    });

    it('allows entries with complete metadata (K-001)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'knowledge.curation', author: 'AI Agent', source: 'research', topic: 'MenWise360' });
      expect(effect).toBe('allow');
    });

    it('denies expired entries after 2 years (K-002)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'knowledge.health', yearsSinceReview: 2 });
      expect(effect).toBe('deny');
    });

    it('allows entries within review cadence (K-002)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'knowledge.health', yearsSinceReview: 1 });
      expect(effect).toBe('allow');
    });

    it('requires approval for AI-generated entries (K-003)', () => {
      const effect = workforce.evaluatePolicy('tasks', { actionType: 'publish-knowledge-entry', isAIGenerated: true });
      expect(effect).toBe('require-approval');
    });

    it('allows human-authored entries without approval (K-003)', () => {
      const effect = workforce.evaluatePolicy('tasks', { actionType: 'publish-knowledge-entry', isAIGenerated: false });
      expect(effect).toBe('allow');
    });

    it('denies sensitive search without authorization (K-004)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'knowledge.search', isSensitive: true, authorizedWorkstream: null });
      expect(effect).toBe('deny');
    });

    it('allows sensitive search with authorization (K-004)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'knowledge.search', isSensitive: true, authorizedWorkstream: 'Executive Office' });
      expect(effect).toBe('allow');
    });

    it('denies unversioned changes (K-005)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'knowledge.curation', isVersioned: false, author: 'AI Agent', source: 'research', topic: 'Architecture' });
      expect(effect).toBe('deny');
    });

    it('allows versioned changes (K-005)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'knowledge.curation', isVersioned: true, author: 'AI Agent', source: 'research', topic: 'Architecture' });
      expect(effect).toBe('allow');
    });
  });

  // ── 7.5 — Lifecycle Events ──

  describe('7.5 — Lifecycle Events', () => {
    it('records onboarding for all 4 agents', () => {
      for (const agent of office.listAgents()) {
        const events = workforce.getAgentLifecycle(agent.agentId);
        expect(events.length).toBe(1);
        expect(events[0].eventType).toBe('onboarded');
        expect(events[0].performedBy).toBe('EVDP-007');
      }
    });
  });

  // ── 7.6 — Knowledge Communications ──

  describe('7.6 — Knowledge Communications', () => {
    it('curation agent can ingest knowledge entries', () => {
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'Director of Knowledge', recipient: 'KNOW-CUR-001',
        payload: { command: 'ingest-knowledge-entry', topic: 'Architecture Overview', author: 'AI Agent', source: 'Gamma OS', isVersioned: true }, timestamp: 0,
        correlationId: 'know-demo-1', auditRef: 'audit-knowledge', priority: 3,
      });
      const inbox = workforce.getAgentInbox('KNOW-CUR-001');
      expect(inbox.length).toBe(1);
      expect(inbox[0].payload).toHaveProperty('topic');
    });

    it('search agent can respond to queries', () => {
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'Product Manager', recipient: 'KNOW-SRCH-001',
        payload: { query: 'deployment procedures', isSensitive: false }, timestamp: 0,
        correlationId: 'know-demo-2', auditRef: 'audit-knowledge', priority: 3,
      });
      workforce.sendMessage({
        messageId: '', type: 'response', sender: 'KNOW-SRCH-001', recipient: 'Product Manager',
        payload: { results: [{ title: 'Deployment Runbook', score: 0.95 }], totalResults: 1 }, timestamp: 0,
        correlationId: 'know-demo-2', auditRef: 'audit-knowledge', priority: 3,
      });
      const conv = workforce.getConversation('know-demo-2');
      expect(conv.length).toBe(2);
    });

    it('lessons learned agent can capture retrospectives', () => {
      workforce.sendMessage({
        messageId: '', type: 'response', sender: 'KNOW-LESS-001', recipient: 'Director of Knowledge',
        payload: { lesson: 'Deploy on Tuesday, not Friday', applicabilityScore: 0.88, project: 'MenWise360 Release' }, timestamp: 0,
        correlationId: 'know-demo-3', auditRef: 'audit-knowledge', priority: 3,
      });
      const inbox = workforce.getAgentInbox('Director of Knowledge');
      const lessons = inbox.filter(m => m.correlationId === 'know-demo-3');
      expect(lessons.length).toBe(1);
      expect(lessons[0].payload).toHaveProperty('applicabilityScore');
    });

    it('health agent can report knowledge gaps', () => {
      workforce.sendMessage({
        messageId: '', type: 'response', sender: 'KNOW-HLTH-001', recipient: 'Director of Knowledge',
        payload: { coverage: 0.72, gapCategories: ['Architecture'], entriesExpiringSoon: 3 }, timestamp: 0,
        correlationId: 'know-demo-4', auditRef: 'audit-knowledge', priority: 3,
      });
      const inbox = workforce.getAgentInbox('Director of Knowledge');
      const reports = inbox.filter(m => m.correlationId === 'know-demo-4');
      expect(reports.length).toBe(1);
      expect(reports[0].payload).toHaveProperty('coverage');
    });
  });

  // ── 7.7 — Full Knowledge Lifecycle ──

  describe('7.7 — Knowledge Lifecycle', () => {
    it('supports knowledge lifecycle: curate → search → learn → monitor', () => {
      // Phase 1: Curation agent ingests knowledge
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'Director of Knowledge', recipient: 'KNOW-CUR-001',
        payload: { command: 'ingest-knowledge-entry', topic: 'Incident Response', author: 'Operations', source: 'postmortem', isVersioned: true }, timestamp: 0,
        correlationId: 'lifecycle-know', auditRef: 'audit-knowledge-lifecycle', priority: 3,
      });
      // Phase 2: Search agent indexes and surfaces
      workforce.sendMessage({
        messageId: '', type: 'response', sender: 'KNOW-SRCH-001', recipient: 'Product Manager',
        payload: { results: [{ title: 'Incident Response Runbook', score: 0.98 }] }, timestamp: 0,
        correlationId: 'lifecycle-know', auditRef: 'audit-knowledge-lifecycle', priority: 3,
      });
      // Phase 3: Lessons learned agent captures insights
      workforce.sendMessage({
        messageId: '', type: 'response', sender: 'KNOW-LESS-001', recipient: 'Director of Knowledge',
        payload: { lesson: 'Add monitoring before feature launch', applicabilityScore: 0.92 }, timestamp: 0,
        correlationId: 'lifecycle-know', auditRef: 'audit-knowledge-lifecycle', priority: 3,
      });
      const conv = workforce.getConversation('lifecycle-know');
      expect(conv.length).toBe(3);
    });
  });
});
