import { describe, it, expect } from 'vitest';
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { ExecutiveOffice } from '../../lib/executive-office/executive-office';
import { ResearchOffice } from '../../lib/research-office/research-office';
import { ProductOffice } from '../../lib/product-office/product-office';
import { OperationsOffice } from '../../lib/operations-office/operations-office';
import { KnowledgeOffice } from '../../lib/knowledge-office/knowledge-office';
import { ExecutiveIntelligence } from '../../lib/executive-intelligence/intelligence-engine';
import { BIBLE_QUEST_PROFILE } from '../../lib/executive-intelligence/product-profile-types';

const INITIATIVE_ID = 'BQ-David-Goliath-Module-001';
const CORRELATION_ID = 'corr-bq-david-goliath-001';

function deployAllOffices(workforce: WorkforcePlatformImpl): void {
  new ExecutiveOffice(workforce).deploy();
  new ResearchOffice(workforce).deploy();
  new ProductOffice(workforce).deploy();
  new OperationsOffice(workforce).deploy();
  new KnowledgeOffice(workforce).deploy();
}

describe('Bible Quest — Operational Validation', () => {

  it('stage 2.1: deployment profile exists with all required fields', () => {
    expect(BIBLE_QUEST_PROFILE.productId).toBe('bible-quest');
    expect(BIBLE_QUEST_PROFILE.mission).toBeDefined();
    expect(BIBLE_QUEST_PROFILE.targetUsers.length).toBeGreaterThan(0);
    expect(BIBLE_QUEST_PROFILE.officeMappings.length).toBe(5);
    expect(BIBLE_QUEST_PROFILE.workflowStageMappings.length).toBe(6);
    expect(BIBLE_QUEST_PROFILE.governanceRequirements).toContain('Biblical accuracy review');
  });

  it('full lifecycle: David and Goliath module exercises all 5 offices through existing model', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);

    // Stage 1: Executive prioritizes the David and Goliath module
    workforce.createTask({
      taskId: '', type: 'executive-priority', summary: 'Prioritize David and Goliath character learning module for Bible Quest',
      assignedTo: 'EXEC-PORT-001', assignedBy: 'CEO', status: 'completed',
      priority: 4, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Stage 2: Research validates biblical and historical accuracy
    workforce.createTask({
      taskId: '', type: 'research-validation', summary: 'Validate David and Goliath biblical sources for Bible Quest module',
      assignedTo: 'RES-SYNTH-001', assignedBy: 'Director of Research', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Stage 3: Product plans the module on the curriculum roadmap
    workforce.createTask({
      taskId: '', type: 'curriculum-planning', summary: 'Schedule David and Goliath module on Bible Quest curriculum roadmap',
      assignedTo: 'PROD-RMAP-001', assignedBy: 'Director of Product', status: 'planning',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Stage 4: Operations creates and publishes the content
    workforce.createTask({
      taskId: '', type: 'content-creation', summary: 'Write David and Goliath character study for Bible Quest publication',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Stage 5: Knowledge captures lessons and reusable patterns
    workforce.createTask({
      taskId: '', type: 'knowledge-capture', summary: 'Capture David and Goliath module outcomes for Bible Quest curriculum archive',
      assignedTo: 'KNOW-ARCH-001', assignedBy: 'Director of Knowledge', status: 'completed',
      priority: 2, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });
    const briefing = eis.refreshAndBrief();

    // Validation: EIS reports accurate state using the same model
    expect(briefing.metadata.sources).toContain('Research Office');
    expect(briefing.metadata.sources).toContain('Product Office');
    expect(briefing.metadata.sources).toContain('Operations Office');
    expect(briefing.metadata.sources).toContain('Knowledge Office');
    expect(briefing.organizationHealth.overall).toBe('healthy');
    expect(briefing.metadata.snapshotVersion).toContain('snap-');
  });

  it('blocked content surfaces as ranked priority — same EDSS behavior as MenWise360', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);

    workforce.createTask({
      taskId: '', type: 'content-blocked', summary: 'David and Goliath module blocked — biblical accuracy review flagged concerns',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 4, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const briefing = eis.refreshAndBrief();

    expect(briefing.rankedPriorities.length).toBeGreaterThanOrEqual(1);
    expect(briefing.activeRisks.length).toBeGreaterThanOrEqual(1);
    expect(briefing.structuredRecommendations.length).toBeGreaterThanOrEqual(1);

    const blocker = briefing.blockedItems.find(b => b.office === 'Operations Office');
    expect(blocker).toBeDefined();
  });

  it('governance pause — denominational sensitivity review stops workflow', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);

    // Content created, pending governance approval
    workforce.createTask({
      taskId: '', type: 'content-draft', summary: 'David and Goliath module draft complete awaiting governance review',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    // Denominational sensitivity check pauses publication
    workforce.requestHumanReview({
      requestId: '', agentId: 'EXEC-COMMS-001', actionType: 'denominational-sensitivity-review',
      context: { module: 'David and Goliath', product: 'Bible Quest', concern: 'Violence depiction appropriate for target age group' },
      mode: 'stop', requestedAt: Date.now(), resolvedAt: null, resolution: null, resolvedBy: null,
    });

    // Create a blocked task to surface in EIS
    workforce.createTask({
      taskId: '', type: 'publication-paused', summary: 'Publication paused pending sensitivity review for Bible Quest',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 4, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const briefing = eis.refreshAndBrief();

    // Pending decision appears in EIS
    expect(briefing.pendingDecisions.length).toBeGreaterThanOrEqual(1);
    expect(briefing.pendingDecisions.some(d => d.actionType === 'denominational-sensitivity-review')).toBe(true);

    // EDSS responds with recommendations
    expect(briefing.structuredRecommendations.length).toBeGreaterThanOrEqual(1);

    // Resolve the governance review
    workforce.getPendingHumanReviews().forEach(r => {
      workforce.resolveHumanReview(r.requestId, 'approved', 'Director of Product');
    });

    const briefing2 = eis.refreshAndBrief();
    expect(briefing2.pendingDecisions.length).toBe(0);
  });

  it('delta captures state changes across the Bible Quest lifecycle', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);

    // Snapshot 1: Initial state after executive priority set
    workforce.createTask({
      taskId: '', type: 'executive-set', summary: 'Set Bible Quest David and Goliath module as Q3 priority',
      assignedTo: 'EXEC-PORT-001', assignedBy: 'CEO', status: 'completed',
      priority: 4, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Snapshot 2: Research complete, blocked
    workforce.createTask({
      taskId: '', type: 'research-done', summary: 'David and Goliath research complete for Bible Quest',
      assignedTo: 'RES-SYNTH-001', assignedBy: 'Director of Research', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });
    workforce.createTask({
      taskId: '', type: 'ops-blocked', summary: 'Content creation blocked waiting for product roadmap — critical',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 4, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    const delta = eis.getDelta();
    expect(delta).not.toBeNull();
    if (delta) {
      expect(delta.summary).not.toBe('No material changes detected');
      expect(delta.newBlockers.length).toBeGreaterThanOrEqual(1);
      expect(delta.previousSnapshotId).not.toBe(delta.currentSnapshotId);
    }
  });

  it('profile office mappings match actual office behavior', () => {
    const researchMapping = BIBLE_QUEST_PROFILE.officeMappings.find(m => m.office === 'Research Office');
    expect(researchMapping).toBeDefined();
    expect(researchMapping!.responsibilities).toContain('Validate biblical and historical accuracy');

    const productMapping = BIBLE_QUEST_PROFILE.officeMappings.find(m => m.office === 'Product Office');
    expect(productMapping).toBeDefined();
    expect(productMapping!.responsibilities).toContain('Maintain curriculum roadmap');
  });
});
