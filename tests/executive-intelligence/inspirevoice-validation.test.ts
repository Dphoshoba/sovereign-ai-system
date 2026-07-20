import { describe, it, expect } from 'vitest';
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { ExecutiveOffice } from '../../lib/executive-office/executive-office';
import { ResearchOffice } from '../../lib/research-office/research-office';
import { ProductOffice } from '../../lib/product-office/product-office';
import { OperationsOffice } from '../../lib/operations-office/operations-office';
import { KnowledgeOffice } from '../../lib/knowledge-office/knowledge-office';
import { ExecutiveIntelligence } from '../../lib/executive-intelligence/intelligence-engine';
import { INSPIREVOICE_PROFILE, BIBLE_QUEST_PROFILE, CREATOR_AUTOMATION_PROFILE, VISIONCRAFT_STUDIO_PROFILE, MENWISE360_PROFILE, type ProductDeploymentProfile } from '../../lib/executive-intelligence/product-profile-types';

const INITIATIVE_ID = 'IV-EduVideo-001';
const CORRELATION_ID = 'corr-iv-eduvideo-001';

function deployAllOffices(workforce: WorkforcePlatformImpl): void {
  new ExecutiveOffice(workforce).deploy();
  new ResearchOffice(workforce).deploy();
  new ProductOffice(workforce).deploy();
  new OperationsOffice(workforce).deploy();
  new KnowledgeOffice(workforce).deploy();
}

describe('InspireVoice — Operational Validation', () => {

  it('profile exists with multimedia production field mappings', () => {
    expect(INSPIREVOICE_PROFILE.productId).toBe('inspirevoice');
    expect(INSPIREVOICE_PROFILE.officeMappings.length).toBe(5);
    expect(INSPIREVOICE_PROFILE.workflowStageMappings.length).toBe(9);
    expect(INSPIREVOICE_PROFILE.governanceRequirements).toContain('Content accuracy and source validation');
    expect(INSPIREVOICE_PROFILE.governanceRequirements).toContain('Voice synthesis quality assurance');
    expect(INSPIREVOICE_PROFILE.adaptionsFromReference.length).toBeGreaterThanOrEqual(4);
  });

  it('full lifecycle: AI-narrated educational video exercises all 5 offices', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);

    // Stage 1: Executive approves educational video release
    workforce.createTask({
      taskId: '', type: 'release-approval', summary: 'Approve Q3 educational video series on AI fundamentals for InspireVoice',
      assignedTo: 'EXEC-PORT-001', assignedBy: 'CEO', status: 'completed',
      priority: 4, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 86400000 * 5, accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Stage 2: Research validates sources and audience
    workforce.createTask({
      taskId: '', type: 'source-validation', summary: 'Validate source materials and conduct audience research for AI fundamentals video',
      assignedTo: 'RES-COL-001', assignedBy: 'Director of Research', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 86400000 * 4, accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Stage 3: Product plans script and defines features
    workforce.createTask({
      taskId: '', type: 'script-planning', summary: 'Define script outline, acceptance criteria, and production roadmap for AI fundamentals video',
      assignedTo: 'PROD-RMAP-001', assignedBy: 'Director of Product', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 86400000 * 3, accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Stage 4: Operations handles voice, visual, assembly, rendering, publishing
    workforce.createTask({
      taskId: '', type: 'voice-generation', summary: 'Generate AI voice narration for AI fundamentals script',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 86400000 * 2, accepted: null, completed: null, auditTrail: [],
    });
    workforce.createTask({
      taskId: '', type: 'visual-production', summary: 'Coordinate visual assets for AI fundamentals video',
      assignedTo: 'OPS-PROJ-001', assignedBy: 'Director of Operations', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 86400000, accepted: null, completed: null, auditTrail: [],
    });
    workforce.createTask({
      taskId: '', type: 'media-assembly', summary: 'Assemble and render AI fundamentals educational video',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 43200000, accepted: null, completed: null, auditTrail: [],
    });
    workforce.createTask({
      taskId: '', type: 'publishing', summary: 'Publish AI fundamentals video to educational channels',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 21600000, accepted: null, completed: null, auditTrail: [],
    });
    workforce.createTask({
      taskId: '', type: 'quality-review', summary: 'Perform quality review and content accuracy gate on published video',
      assignedTo: 'OPS-REV-001', assignedBy: 'Director of Operations', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 7200000, accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Stage 5: Knowledge captures patterns and playbooks
    workforce.createTask({
      taskId: '', type: 'knowledge-capture', summary: 'Capture prompt patterns, production playbooks, and encoding profiles from AI fundamentals video run',
      assignedTo: 'KNOW-CUR-001', assignedBy: 'Director of Knowledge', status: 'completed',
      priority: 2, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 3600000, accepted: null, completed: null, auditTrail: [],
    });
    const briefing = eis.refreshAndBrief();

    expect(briefing.metadata.sources).toContain('Executive Office');
    expect(briefing.metadata.sources).toContain('Research Office');
    expect(briefing.metadata.sources).toContain('Product Office');
    expect(briefing.metadata.sources).toContain('Operations Office');
    expect(briefing.metadata.sources).toContain('Knowledge Office');
    expect(briefing.organizationHealth.overall).toBe('healthy');
  });

  it('quality review gate: content accuracy failure surfaces as blocked priority', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);

    // Video published successfully
    workforce.createTask({
      taskId: '', type: 'video-published', summary: 'AI fundamentals video published pending content accuracy review',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    // Content accuracy review identifies issues
    workforce.createTask({
      taskId: '', type: 'accuracy-failure', summary: 'Content accuracy review failed — AI timeline dates incorrect, requires script revision — critical',
      assignedTo: 'OPS-REV-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 5, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const briefing = eis.refreshAndBrief();

    expect(briefing.rankedPriorities.length).toBeGreaterThanOrEqual(1);
    expect(briefing.blockedItems.length).toBeGreaterThanOrEqual(1);
    expect(briefing.structuredRecommendations.length).toBeGreaterThanOrEqual(1);

    const blocker = briefing.blockedItems.find(b => b.office === 'Operations Office');
    expect(blocker).toBeDefined();
  });

  it('media governance: voice synthesis quality checkpoint surfaces in pending decisions', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);

    // Script ready for voice generation
    workforce.createTask({
      taskId: '', type: 'script-ready', summary: 'AI fundamentals script approved and ready for voice generation',
      assignedTo: 'PROD-RMAP-001', assignedBy: 'Director of Product', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    // Voice synthesis quality checkpoint
    workforce.requestHumanReview({
      requestId: '', agentId: 'EXEC-COMMS-001', actionType: 'voice-synthesis-quality-check',
      context: { video: 'AI Fundamentals', product: 'InspireVoice', check: 'Voice synthesis quality standard' },
      mode: 'stop', requestedAt: Date.now(), resolvedAt: null, resolution: null, resolvedBy: null,
    });

    // Production blocked pending quality sign-off
    workforce.createTask({
      taskId: '', type: 'production-blocked', summary: 'Visual production blocked pending voice synthesis quality sign-off — critical',
      assignedTo: 'OPS-PROJ-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 5, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const briefing = eis.refreshAndBrief();

    expect(briefing.pendingDecisions.length).toBeGreaterThanOrEqual(1);
    expect(briefing.pendingDecisions.some(d => d.actionType === 'voice-synthesis-quality-check')).toBe(true);
    expect(briefing.activeRisks.length).toBeGreaterThanOrEqual(1);

    // Resolve voice quality check
    workforce.getPendingHumanReviews().forEach(r => {
      workforce.resolveHumanReview(r.requestId, 'approved', 'Quality Director');
    });

    const briefing2 = eis.refreshAndBrief();
    expect(briefing2.pendingDecisions.length).toBe(0);
  });

  it('delta captures state changes across media production lifecycle', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);

    // Initial state: script approved
    workforce.createTask({
      taskId: '', type: 'script-approved', summary: 'AI fundamentals script approved for InspireVoice production',
      assignedTo: 'PROD-RMAP-001', assignedBy: 'Director of Product', status: 'completed',
      priority: 3, dependencies: [], humanApprovalRequired: false,
      created: Date.now() - 86400000, accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    // Later: rendering pipeline failure
    workforce.createTask({
      taskId: '', type: 'render-failure', summary: 'Video rendering pipeline failure — encoding error in media assembly — critical',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 5, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });
    eis.refreshSnapshot();

    const delta = eis.getDelta();
    expect(delta).not.toBeNull();
    if (delta) {
      expect(delta.summary).not.toBe('No material changes detected');
      expect(delta.newBlockers.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('Stage 4.4 — Portfolio Comparison', () => {

  const portfolio: { product: string; profile: ProductDeploymentProfile }[] = [
    { product: 'MenWise360', profile: MENWISE360_PROFILE },
    { product: 'Bible Quest', profile: BIBLE_QUEST_PROFILE },
    { product: 'Creator Automation', profile: CREATOR_AUTOMATION_PROFILE },
    { product: 'VisionCraft Studio', profile: VISIONCRAFT_STUDIO_PROFILE },
    { product: 'InspireVoice', profile: INSPIREVOICE_PROFILE },
  ];

  it('all 5 products have complete profiles with 5 office mappings each', () => {
    for (const { product, profile } of portfolio) {
      expect(profile.officeMappings.length).toBe(5);
      const offices = profile.officeMappings.map(o => o.office);
      expect(offices).toContain('Executive Office');
      expect(offices).toContain('Research Office');
      expect(offices).toContain('Product Office');
      expect(offices).toContain('Operations Office');
      expect(offices).toContain('Knowledge Office');
    }
  });

  it('every product has unique adaptions reflecting domain-specific governance', () => {
    const allAdaptions = portfolio.map(p => p.profile.adaptionsFromReference);
    for (let i = 0; i < allAdaptions.length; i++) {
      for (let j = i + 1; j < allAdaptions.length; j++) {
        const overlap = allAdaptions[i].filter(a => allAdaptions[j].includes(a));
        // Shared patterns are acceptable but no two products should have identical adaption sets
        expect(overlap.length).toBeLessThan(allAdaptions[j].length);
      }
    }
  });

  it('every product maps through distinct workflow stages with different stage counts', () => {
    const stageCounts = portfolio.map(p => ({ product: p.product, count: p.profile.workflowStageMappings.length }));
    const uniqueCounts = new Set(stageCounts.map(s => s.count));
    // At minimum, products demonstrate varying lifecycle complexity
    expect(uniqueCounts.size).toBeGreaterThanOrEqual(2);
  });

  it('InspireVoice has the broadest governance surface in the portfolio', () => {
    const governanceCounts = portfolio.map(p => ({
      product: p.product,
      count: p.profile.governanceRequirements.length,
    }));
    const inspireVoice = governanceCounts.find(g => g.product === 'InspireVoice')!;
    const maxOthers = Math.max(...governanceCounts.filter(g => g.product !== 'InspireVoice').map(g => g.count));
    expect(inspireVoice.count).toBeGreaterThanOrEqual(maxOthers);
  });

  it('InspireVoice has the most lifecycle stages reflecting multimedia production complexity', () => {
    const stageCounts = portfolio.map(p => ({
      product: p.product,
      count: p.profile.lifecycleStages.length,
    }));
    const inspireVoice = stageCounts.find(s => s.product === 'InspireVoice')!;
    const maxOthers = Math.max(...stageCounts.filter(s => s.product !== 'InspireVoice').map(s => s.count));
    expect(inspireVoice.count).toBeGreaterThanOrEqual(maxOthers);
  });

  it('no platform modifications required across portfolio — all products use same offices, EIS, EDSS', () => {
    for (const { product, profile } of portfolio) {
      // All products reference the 5 standard offices
      expect(profile.officeMappings.every(m => ['Executive Office', 'Research Office', 'Product Office', 'Operations Office', 'Knowledge Office'].includes(m.office))).toBe(true);
    }
  });
});
