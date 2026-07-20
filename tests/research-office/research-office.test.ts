import { describe, it, expect, beforeEach } from 'vitest';
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { ResearchOffice } from '../../lib/research-office/research-office';

describe('EVDP-004 — Research Office Deployment', () => {
  let workforce: WorkforcePlatformImpl;
  let office: ResearchOffice;

  beforeEach(() => {
    workforce = new WorkforcePlatformImpl();
    office = new ResearchOffice(workforce);
    office.deploy();
  });

  // ── 4.1 — All Four Agents Deployed ──

  describe('4.1 — Agent Identity', () => {
    it('deploys all 4 research agents', () => {
      const agents = office.listAgents();
      expect(agents.length).toBe(4);
    });

    it('deploys Research Collection Agent', () => {
      const agent = office.getAgent('RES-COL-001');
      expect(agent).toBeDefined();
      expect(agent!.role).toBe('Research Collection Agent');
      expect(agent!.authorityLevel).toBe('operational');
    });

    it('deploys Evidence Synthesizer Agent', () => {
      const agent = office.getAgent('RES-SYNTH-001');
      expect(agent).toBeDefined();
      expect(agent!.capabilities).toContain('research.synthesis');
      expect(agent!.authorityLevel).toBe('advisory');
    });

    it('deploys Research Reuse Agent', () => {
      const agent = office.getAgent('RES-REUSE-001');
      expect(agent).toBeDefined();
      expect(agent!.capabilities).toContain('research.reuse');
    });

    it('deploys Research Quality Agent', () => {
      const agent = office.getAgent('RES-QUAL-001');
      expect(agent).toBeDefined();
      expect(agent!.capabilities).toContain('research.quality');
    });
  });

  // ── 4.2 — Skills & Capabilities ──

  describe('4.2 — Skills & Capabilities', () => {
    it('registers all 9 research skills', () => {
      expect(workforce.listAllSkills().length).toBe(9);
    });

    it('assigns 3 skills to collection agent', () => {
      const skills = workforce.getAgentSkills('RES-COL-001');
      expect(skills.length).toBe(3);
      expect(skills.some(s => s.skillId === 'RES-SKILL-DATA-INGESTION')).toBe(true);
      expect(skills.some(s => s.skillId === 'RES-SKILL-SOURCE-VERIFICATION')).toBe(true);
    });

    it('assigns 4 skills to synthesizer agent', () => {
      expect(workforce.getAgentSkills('RES-SYNTH-001').length).toBe(4);
    });

    it('assigns 3 skills to reuse agent', () => {
      expect(workforce.getAgentSkills('RES-REUSE-001').length).toBe(3);
    });

    it('assigns 3 skills to quality agent', () => {
      expect(workforce.getAgentSkills('RES-QUAL-001').length).toBe(3);
    });

    it('finds agents with synthesis skill', () => {
      const agents = workforce.findAgentsBySkill('RES-SKILL-SYNTHESIS', 0.8);
      expect(agents).toContain('RES-SYNTH-001');
    });
  });

  // ── 4.3 — Collaboration Rules ──

  describe('4.3 — Collaboration Rules', () => {
    it('sets autonomous mode for research collection', () => {
      const rule = workforce.getCollaborationMode('collect-research-data');
      expect(rule).toBeDefined();
      expect(rule!.defaultMode).toBe('act-autonomously');
    });

    it('sets inform mode for low-confidence flags', () => {
      const rule = workforce.getCollaborationMode('flag-low-confidence-entry');
      expect(rule!.defaultMode).toBe('inform');
    });

    it('sets recommend mode for evidence synthesis', () => {
      const rule = workforce.getCollaborationMode('synthesize-evidence');
      expect(rule!.defaultMode).toBe('recommend');
      expect(rule!.escalateAfterMs).toBe(7 * 86400000);
    });

    it('sets inform mode for research applicability notifications', () => {
      const rule = workforce.getCollaborationMode('notify-research-applicable');
      expect(rule!.defaultMode).toBe('inform');
    });

    it('sets recommend mode for archive recommendations', () => {
      const rule = workforce.getCollaborationMode('recommend-archive');
      expect(rule!.defaultMode).toBe('recommend');
      expect(rule!.escalateAfterMs).toBe(30 * 86400000);
    });
  });

  // ── 4.4 — Governance Policies ──

  describe('4.4 — Governance Policies', () => {
    it('applies 4 research office policies', () => {
      expect(workforce.listPolicies().length).toBe(4);
    });

    it('denies collection entries without source verification (R-001)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'research.collection', entryConfidence: null });
      expect(effect).toBe('deny');
    });

    it('allows collection entries with valid confidence (R-001)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'research.collection', entryConfidence: 0.8 });
      expect(effect).toBe('allow');
    });

    it('denies non-inform reuse notifications (R-002)', () => {
      const effect = workforce.evaluatePolicy('collaboration', { actionType: 'notify-research-applicable', defaultMode: 'act-autonomously' });
      expect(effect).toBe('deny');
    });

    it('allows inform-mode reuse notifications (R-002)', () => {
      const effect = workforce.evaluatePolicy('collaboration', { actionType: 'notify-research-applicable', defaultMode: 'inform' });
      expect(effect).toBe('allow');
    });

    it('requires approval for outdated research reuse (R-003)', () => {
      const effect = workforce.evaluatePolicy('tasks', { actionType: 'reuse-research', isOutdated: true });
      expect(effect).toBe('require-approval');
    });

    it('allows reuse of current research (R-003)', () => {
      const effect = workforce.evaluatePolicy('tasks', { actionType: 'reuse-research', isOutdated: false });
      expect(effect).toBe('allow');
    });

    it('denies synthesis of low-confidence cross-references (R-004)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'research.synthesis', crossRefConfidence: 0.3 });
      expect(effect).toBe('deny');
    });

    it('allows synthesis of high-confidence cross-references (R-004)', () => {
      const effect = workforce.evaluatePolicy('tasks', { capabilityScope: 'research.synthesis', crossRefConfidence: 0.7 });
      expect(effect).toBe('allow');
    });
  });

  // ── 4.5 — Lifecycle Events ──

  describe('4.5 — Lifecycle Events', () => {
    it('records onboarding for all 4 agents', () => {
      for (const agent of office.listAgents()) {
        const events = workforce.getAgentLifecycle(agent.agentId);
        expect(events.length).toBe(1);
        expect(events[0].eventType).toBe('onboarded');
        expect(events[0].performedBy).toBe('EVDP-004');
      }
    });
  });

  // ── 4.6 — Research Communications ──

  describe('4.6 — Research Communications', () => {
    it('collection agent can receive research requests', () => {
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'Director of Research', recipient: 'RES-COL-001',
        payload: { command: 'collect-research-data', topic: 'user-behaviour-2026' }, timestamp: 0,
        correlationId: 'research-demo-1', auditRef: 'audit-research', priority: 3,
      });
      const inbox = workforce.getAgentInbox('RES-COL-001');
      expect(inbox.length).toBe(1);
      expect(inbox[0].payload).toHaveProperty('topic');
    });

    it('synthesizer can produce cross-product gap analysis', () => {
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'Director of Research', recipient: 'RES-SYNTH-001',
        payload: { command: 'produce-gap-analysis', products: ['MenWise360', 'Bible Quest'] }, timestamp: 0,
        correlationId: 'research-demo-2', auditRef: 'audit-research', priority: 3,
      });
      workforce.sendMessage({
        messageId: '', type: 'response', sender: 'RES-SYNTH-001', recipient: 'Director of Research',
        payload: { gaps: ['MenWise360 onboarding data unavailable for Bible Quest'], confidence: 0.92 }, timestamp: 0,
        correlationId: 'research-demo-2', auditRef: 'audit-research', priority: 3,
      });
      const conv = workforce.getConversation('research-demo-2');
      expect(conv.length).toBe(2);
    });

    it('reuse agent sends applicable-research notifications', () => {
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'RES-REUSE-001', recipient: 'Director of Research',
        payload: { notification: 'New sleep study applicable to MenWise360', relevanceScore: 0.87 }, timestamp: 0,
        correlationId: 'research-demo-3', auditRef: 'audit-research', priority: 3,
      });
      const inbox = workforce.getAgentInbox('Director of Research');
      const notifications = inbox.filter(m => m.correlationId === 'research-demo-3');
      expect(notifications.length).toBe(1);
    });

    it('quality agent flags outdated research', () => {
      workforce.sendMessage({
        messageId: '', type: 'escalation', sender: 'RES-QUAL-001', recipient: 'Director of Research',
        payload: { flag: 'outdated-research', researchId: 'MENWISE-001', lastReviewed: '2023-01-15' }, timestamp: 0,
        correlationId: 'research-demo-4', auditRef: 'audit-research', priority: 4,
      });
      const inbox = workforce.getAgentInbox('Director of Research');
      const flags = inbox.filter(m => m.correlationId === 'research-demo-4');
      expect(flags.length).toBe(1);
      expect(flags[0].priority).toBe(4);
    });
  });

  // ── 4.7 — Research Quality & Governance ──

  describe('4.7 — Research Quality & Governance', () => {
    it('quality agent can assess research entry quality', () => {
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'RES-QUAL-001', recipient: 'Director of Research',
        payload: { assessment: 'Methodology sound, sample size adequate', qualityScore: 0.85, researchId: 'RES-001' }, timestamp: 0,
        correlationId: 'quality-demo-1', auditRef: 'audit-quality', priority: 3,
      });
      const inbox = workforce.getAgentInbox('Director of Research');
      const assessments = inbox.filter(m => m.correlationId === 'quality-demo-1');
      expect(assessments.length).toBe(1);
      expect(assessments[0].payload).toHaveProperty('qualityScore');
    });

    it('supports full research lifecycle: collect → synthesize → reuse', () => {
      // Phase 1: Collection agent collects research
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'Director of Research', recipient: 'RES-COL-001',
        payload: { command: 'collect-research-data', source: 'peer-reviewed', confidence: 0.92 }, timestamp: 0,
        correlationId: 'lifecycle-demo', auditRef: 'audit-lifecycle', priority: 3,
      });
      // Phase 2: Synthesizer cross-references
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'Director of Research', recipient: 'RES-SYNTH-001',
        payload: { command: 'synthesize-evidence', crossRefConfidence: 0.85 }, timestamp: 0,
        correlationId: 'lifecycle-demo', auditRef: 'audit-lifecycle', priority: 3,
      });
      // Phase 3: Reuse agent notifies applicable products
      workforce.sendMessage({
        messageId: '', type: 'response', sender: 'RES-REUSE-001', recipient: 'Director of Research',
        payload: { notification: 'Finding applies to MenWise360 and Bible Quest', relevance: 0.78 }, timestamp: 0,
        correlationId: 'lifecycle-demo', auditRef: 'audit-lifecycle', priority: 3,
      });
      const conv = workforce.getConversation('lifecycle-demo');
      expect(conv.length).toBe(3);
    });
  });
});
