import { describe, it, expect, beforeEach } from 'vitest';
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { ExecutiveOffice } from '../../lib/executive-office/executive-office';

describe('EVDP-003 — Executive Office Deployment', () => {
  let workforce: WorkforcePlatformImpl;
  let office: ExecutiveOffice;

  beforeEach(() => {
    workforce = new WorkforcePlatformImpl();
    office = new ExecutiveOffice(workforce);
    office.deploy();
  });

  // ── 3.1 — All Six Agents Deployed ──

  describe('3.1 — Agent Identity', () => {
    it('deploys all 6 executive agents', () => {
      const agents = office.listAgents();
      expect(agents.length).toBe(6);
    });

    it('deploys Executive Briefing Agent', () => {
      const agent = office.getAgent('EXEC-BRIEF-001');
      expect(agent).toBeDefined();
      expect(agent!.role).toBe('Executive Briefing Agent');
      expect(agent!.authorityLevel).toBe('advisory');
    });

    it('deploys Strategic Planning Agent', () => {
      const agent = office.getAgent('EXEC-STRAT-001');
      expect(agent).toBeDefined();
      expect(agent!.capabilities).toContain('planning');
    });

    it('deploys Priority & Portfolio Agent', () => {
      const agent = office.getAgent('EXEC-PORT-001');
      expect(agent).toBeDefined();
      expect(agent!.authorityLevel).toBe('operational');
    });

    it('deploys Governance & Risk Advisor', () => {
      const agent = office.getAgent('EXEC-RISK-001');
      expect(agent).toBeDefined();
      expect(agent!.capabilities).toContain('governance');
    });

    it('deploys Meeting Intelligence Agent', () => {
      const agent = office.getAgent('EXEC-MEET-001');
      expect(agent).toBeDefined();
      expect(agent!.securityClassification).toBe('confidential');
    });

    it('deploys Executive Communications Agent', () => {
      const agent = office.getAgent('EXEC-COMMS-001');
      expect(agent).toBeDefined();
      expect(agent!.owner).toBe('CEO Office');
    });
  });

  // ── 3.2 — Skills & Capabilities ──

  describe('3.2 — Skills & Capabilities', () => {
    it('registers all 13 executive skills', () => {
      expect(workforce.listAllSkills().length).toBe(13);
    });

    it('assigns skills to agents', () => {
      const briefingSkills = workforce.getAgentSkills('EXEC-BRIEF-001');
      expect(briefingSkills.length).toBe(3);
      expect(briefingSkills.some(s => s.skillId === 'EXEC-SKILL-SUMMARIZATION')).toBe(true);
    });

    it('strategic agent has 4 skills', () => {
      expect(workforce.getAgentSkills('EXEC-STRAT-001').length).toBe(4);
    });

    it('finds briefing-capable agents', () => {
      const agents = workforce.findAgentsBySkill('EXEC-SKILL-SUMMARIZATION', 0.8);
      expect(agents.length).toBeGreaterThanOrEqual(2); // Briefing + Meeting
    });
  });

  // ── 3.3 — Collaboration Rules ──

  describe('3.3 — Collaboration Rules', () => {
    it('sets autonomous briefing collaboration mode', () => {
      const rule = workforce.getCollaborationMode('produce-daily-briefing');
      expect(rule).toBeDefined();
      expect(rule!.defaultMode).toBe('act-autonomously');
    });

    it('sets recommend mode for strategic direction', () => {
      const rule = workforce.getCollaborationMode('recommend-strategic-direction');
      expect(rule).toBeDefined();
      expect(rule!.defaultMode).toBe('recommend');
    });

    it('sets inform mode for risk escalation', () => {
      const rule = workforce.getCollaborationMode('escalate-risk');
      expect(rule!.defaultMode).toBe('inform');
    });

    it('sets 7-day escalation for strategic recommendations', () => {
      const rule = workforce.getCollaborationMode('recommend-strategic-direction');
      expect(rule!.escalateAfterMs).toBe(7 * 86400000);
    });
  });

  // ── 3.4 — Workforce Policies ──

  describe('3.4 — Workforce Policies', () => {
    it('applies 4 executive office policies', () => {
      expect(workforce.listPolicies().length).toBe(4);
    });

    it('denies priority adjustments by briefing agents', () => {
      const effect = workforce.evaluatePolicy('tasks', { agentId: 'EXEC-BRIEF-001', actionType: 'adjust-priority' });
      expect(effect).toBe('deny');
    });

    it('requires approval for strategic recommendations', () => {
      const effect = workforce.evaluatePolicy('collaboration', { actionType: 'recommend-strategic-direction' });
      expect(effect).toBe('require-approval');
    });

    it('requires approval for executive communications', () => {
      const effect = workforce.evaluatePolicy('tasks', { actionType: 'draft-executive-communication' });
      expect(effect).toBe('require-approval');
    });

    it('prevents risk escalation in non-inform mode', () => {
      const effect = workforce.evaluatePolicy('collaboration', { actionType: 'escalate-risk', defaultMode: 'act-autonomously' });
      expect(effect).toBe('deny');
    });
  });

  // ── 3.5 — Lifecycle Events ──

  describe('3.5 — Lifecycle Events', () => {
    it('records onboarding for all 6 agents', () => {
      for (const agent of office.listAgents()) {
        const events = workforce.getAgentLifecycle(agent.agentId);
        expect(events.length).toBe(1);
        expect(events[0].eventType).toBe('onboarded');
      }
    });
  });

  // ── 3.6 — Communications ──

  describe('3.6 — Communications', () => {
    it('agents can send and receive messages', () => {
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'CEO', recipient: 'EXEC-BRIEF-001',
        payload: { command: 'produce-daily-briefing' }, timestamp: 0,
        correlationId: 'exec-demo-1', auditRef: 'audit-demo', priority: 4,
      });
      const inbox = workforce.getAgentInbox('EXEC-BRIEF-001');
      expect(inbox.length).toBe(1);
      expect(inbox[0].type).toBe('request');
    });

    it('agents can respond with recommendations', () => {
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'CEO', recipient: 'EXEC-STRAT-001',
        payload: { command: 'evaluate-strategic-option' }, timestamp: 0,
        correlationId: 'exec-demo-2', auditRef: 'audit-demo', priority: 3,
      });
      workforce.sendMessage({
        messageId: '', type: 'response', sender: 'EXEC-STRAT-001', recipient: 'CEO',
        payload: { recommendation: 'Option A', confidence: 0.85 }, timestamp: 0,
        correlationId: 'exec-demo-2', auditRef: 'audit-demo', priority: 3,
      });
      const conv = workforce.getConversation('exec-demo-2');
      expect(conv.length).toBe(2);
    });
  });

  // ── 3.7 — Governance & Risk ──

  describe('3.7 — Governance & Risk', () => {
    it('risk agent can escalate critical risks', () => {
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'EXEC-RISK-001', recipient: 'CEO',
        payload: { risk: 'Critical compliance gap detected', score: 9 }, timestamp: 0,
        correlationId: 'risk-demo', auditRef: 'audit-risk', priority: 5,
      });
      const ceoInbox = workforce.getAgentInbox('CEO');
      const riskMessages = ceoInbox.filter(m => m.correlationId === 'risk-demo');
      expect(riskMessages.length).toBe(1);
      expect(riskMessages[0].priority).toBe(5);
    });

    it('approves meeting preparation', () => {
      workforce.sendMessage({
        messageId: '', type: 'request', sender: 'CEO', recipient: 'EXEC-MEET-001',
        payload: { meeting: 'Q3 Planning', date: '2026-07-25' }, timestamp: 0,
        correlationId: 'meeting-demo', auditRef: 'audit-meeting', priority: 3,
      });
      workforce.sendMessage({
        messageId: '', type: 'completion', sender: 'EXEC-MEET-001', recipient: 'CEO',
        payload: { status: 'packet-ready' }, timestamp: 0,
        correlationId: 'meeting-demo', auditRef: 'audit-meeting', priority: 3,
      });
      const conv = workforce.getConversation('meeting-demo');
      expect(conv.length).toBe(2);
    });
  });
});
