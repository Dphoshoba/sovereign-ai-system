# Executive Intelligence Service — Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Executive Intelligence Service — a programmatic query layer that collects and synthesizes organizational status from all 5 offices on the AI Workforce Platform.

**Architecture:** Gamma OS → Workforce Platform → 5 Offices → EIS → Consumers. EIS collects facts via Workforce Platform public interface, captures them in an ExecutiveSnapshot, then synthesizes meaning via the Intelligence Engine into an ExecutiveBriefing.

**Tech Stack:** TypeScript, Vitest, existing WorkforcePlatform interface, existing 5 offices.

---

### Task 1: Define EIS Types

**Files:**
- Create: `lib/executive-intelligence/types.ts`
- Test: `tests/executive-intelligence/executive-intelligence.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/executive-intelligence/executive-intelligence.test.ts
import { describe, it, expect } from 'vitest';
import { ExecutiveSnapshot, OfficeStatus, ExecutiveBriefing, EISRecommendation } from '../../lib/executive-intelligence/types';

describe('EIS Types', () => {
  it('defines OfficeStatus with health, priorities, risks, blockers', () => {
    const status: OfficeStatus = {
      office: 'Executive Office',
      health: 'healthy',
      agentCount: 6,
      activeTasks: 3,
      blockers: [],
      recentChanges: [],
    };
    expect(status.office).toBe('Executive Office');
    expect(status.health).toBe('healthy');
  });

  it('defines ExecutiveSnapshot with all 5 offices', () => {
    const snapshot: ExecutiveSnapshot = {
      snapshotId: 'snap-001',
      timestamp: Date.now(),
      offices: {
        'Executive Office': { office: 'Executive Office', health: 'healthy', agentCount: 6, activeTasks: 2, blockers: [], recentChanges: [] },
        'Research Office': { office: 'Research Office', health: 'healthy', agentCount: 4, activeTasks: 1, blockers: [], recentChanges: [] },
        'Product Office': { office: 'Product Office', health: 'healthy', agentCount: 5, activeTasks: 3, blockers: [], recentChanges: [] },
        'Operations Office': { office: 'Operations Office', health: 'healthy', agentCount: 5, activeTasks: 2, blockers: [], recentChanges: [] },
        'Knowledge Office': { office: 'Knowledge Office', health: 'healthy', agentCount: 4, activeTasks: 1, blockers: [], recentChanges: [] },
      },
      pendingDecisions: [],
      escalatedRisks: [],
    };
    expect(Object.keys(snapshot.offices).length).toBe(5);
  });

  it('defines ExecutiveBriefing with all sections', () => {
    const briefing: ExecutiveBriefing = {
      summary: 'Organization healthy',
      organizationHealth: { overall: 'healthy', offices: {} },
      priorities: [],
      activeRisks: [],
      blockedItems: [],
      pendingDecisions: [],
      kpiTrends: { improving: [], declining: [] },
      recommendations: [],
      officeStatus: {},
      metadata: { generatedAt: 0, snapshotVersion: '1', confidence: 1.0, sources: [] },
    };
    expect(briefing.summary).toBeDefined();
    expect(briefing.recommendations).toEqual([]);
  });

  it('defines EISRecommendation with priority, action, reason', () => {
    const rec: EISRecommendation = {
      priority: 'high',
      action: 'Escalate deployment',
      reason: 'Blocked by Operations',
      office: 'Product Office',
    };
    expect(rec.priority).toBe('high');
  });
});
```

**Step 2: Run to verify failure**

Run: `npx vitest run tests/executive-intelligence/executive-intelligence.test.ts 2>&1`
Expected: FAIL — module not found

**Step 3: Write minimal types**

```typescript
// lib/executive-intelligence/types.ts

export type OfficeHealth = 'healthy' | 'attention' | 'critical' | 'unknown';

export interface OfficeStatus {
  office: string;
  health: OfficeHealth;
  agentCount: number;
  activeTasks: number;
  blockers: string[];
  recentChanges: string[];
}

export interface PendingDecision {
  id: string;
  office: string;
  actionType: string;
  requestedAt: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
}

export interface EscalatedRisk {
  id: string;
  office: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  raisedAt: number;
}

export interface ExecutiveSnapshot {
  snapshotId: string;
  timestamp: number;
  offices: Record<string, OfficeStatus>;
  pendingDecisions: PendingDecision[];
  escalatedRisks: EscalatedRisk[];
}

export interface KpiTrend {
  metric: string;
  direction: 'improving' | 'declining' | 'stable';
  currentValue: number;
  previousValue: number;
}

export interface EISRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  reason: string;
  office: string;
}

export interface EISMetadata {
  generatedAt: number;
  snapshotVersion: string;
  confidence: number;
  sources: string[];
}

export interface ExecutiveBriefing {
  summary: string;
  organizationHealth: { overall: OfficeHealth; offices: Record<string, OfficeHealth> };
  priorities: string[];
  activeRisks: EscalatedRisk[];
  blockedItems: { office: string; blockers: string[] }[];
  pendingDecisions: PendingDecision[];
  kpiTrends: { improving: KpiTrend[]; declining: KpiTrend[] };
  recommendations: EISRecommendation[];
  officeStatus: Record<string, OfficeStatus>;
  metadata: EISMetadata;
}
```

**Step 4: Run to verify pass**

Run: `npx vitest run tests/executive-intelligence/executive-intelligence.test.ts 2>&1`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add lib/executive-intelligence/types.ts tests/executive-intelligence/executive-intelligence.test.ts
git commit -m "feat(eis): define core types — ExecutiveSnapshot, OfficeStatus, ExecutiveBriefing, EISRecommendation"
```

---

### Task 2: Office Collectors (5 files)

**Files:**
- Create: `lib/executive-intelligence/collectors/executive-collector.ts`
- Create: `lib/executive-intelligence/collectors/research-collector.ts`
- Create: `lib/executive-intelligence/collectors/product-collector.ts`
- Create: `lib/executive-intelligence/collectors/operations-collector.ts`
- Create: `lib/executive-intelligence/collectors/knowledge-collector.ts`
- Create: `lib/executive-intelligence/collectors/index.ts`
- Modify: `tests/executive-intelligence/executive-intelligence.test.ts`

**Step 1: Write the failing test**

Add to the existing test file:

```typescript
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { ExecutiveOffice } from '../../lib/executive-office/executive-office';
import { ResearchOffice } from '../../lib/research-office/research-office';
import { ProductOffice } from '../../lib/product-office/product-office';
import { OperationsOffice } from '../../lib/operations-office/operations-office';
import { KnowledgeOffice } from '../../lib/knowledge-office/knowledge-office';
import { collectExecutiveStatus } from '../../lib/executive-intelligence/collectors/executive-collector';

describe('EIS Collectors', () => {
  it('executive collector returns offices status with agent count', () => {
    const workforce = new WorkforcePlatformImpl();
    new ExecutiveOffice(workforce).deploy();
    new ResearchOffice(workforce).deploy();
    new ProductOffice(workforce).deploy();
    new OperationsOffice(workforce).deploy();
    new KnowledgeOffice(workforce).deploy();

    const status = collectExecutiveStatus(workforce);
    expect(status.office).toBe('Executive Office');
    expect(status.agentCount).toBe(6);
    expect(status.health).toBe('healthy');
  });
});
```

Add tests for each collector. All follow the same pattern: deploy workforce + all 5 offices, then call collector and verify it returns correct OfficeStatus for its office.

```typescript
import { collectResearchStatus } from '../../lib/executive-intelligence/collectors/research-collector';
import { collectProductStatus } from '../../lib/executive-intelligence/collectors/product-collector';
import { collectOperationsStatus } from '../../lib/executive-intelligence/collectors/operations-collector';
import { collectKnowledgeStatus } from '../../lib/executive-intelligence/collectors/knowledge-collector';

it('research collector returns Research Office status', () => {
  const workforce = new WorkforcePlatformImpl();
  new ExecutiveOffice(workforce).deploy();
  new ResearchOffice(workforce).deploy();
  new ProductOffice(workforce).deploy();
  new OperationsOffice(workforce).deploy();
  new KnowledgeOffice(workforce).deploy();
  const status = collectResearchStatus(workforce);
  expect(status.office).toBe('Research Office');
  expect(status.agentCount).toBe(4);
  expect(status.activeTasks).toBe(0);
});

it('product collector returns Product Office status', () => {
  const workforce = new WorkforcePlatformImpl();
  new ExecutiveOffice(workforce).deploy();
  new ResearchOffice(workforce).deploy();
  new ProductOffice(workforce).deploy();
  new OperationsOffice(workforce).deploy();
  new KnowledgeOffice(workforce).deploy();
  const status = collectProductStatus(workforce);
  expect(status.office).toBe('Product Office');
  expect(status.agentCount).toBe(5);
});

it('operations collector returns Operations Office status', () => {
  const workforce = new WorkforcePlatformImpl();
  new ExecutiveOffice(workforce).deploy();
  new ResearchOffice(workforce).deploy();
  new ProductOffice(workforce).deploy();
  new OperationsOffice(workforce).deploy();
  new KnowledgeOffice(workforce).deploy();
  const status = collectOperationsStatus(workforce);
  expect(status.office).toBe('Operations Office');
  expect(status.agentCount).toBe(5);
});

it('knowledge collector returns Knowledge Office status', () => {
  const workforce = new WorkforcePlatformImpl();
  new ExecutiveOffice(workforce).deploy();
  new ResearchOffice(workforce).deploy();
  new ProductOffice(workforce).deploy();
  new OperationsOffice(workforce).deploy();
  new KnowledgeOffice(workforce).deploy();
  const status = collectKnowledgeStatus(workforce);
  expect(status.office).toBe('Knowledge Office');
  expect(status.agentCount).toBe(4);
});
```

**Step 2: Run to verify failure**

Run: `npx vitest run tests/executive-intelligence/executive-intelligence.test.ts 2>&1`
Expected: FAIL — module not found for collector imports

**Step 3: Write minimal collectors**

Each collector is a function that takes `WorkforcePlatform` and returns `OfficeStatus`.

```typescript
// lib/executive-intelligence/collectors/executive-collector.ts
import { WorkforcePlatform } from '../../workforce/workforce-platform';
import { OfficeStatus } from '../types';

export function collectExecutiveStatus(workforce: WorkforcePlatform): OfficeStatus {
  const agents = workforce.listAgentsByOffice('Executive Office');
  return {
    office: 'Executive Office',
    health: agents.length === 6 ? 'healthy' : 'attention',
    agentCount: agents.length,
    activeTasks: agents.reduce((sum, a) => sum + workforce.getAgentTasks(a.agentId).length, 0),
    blockers: [],
    recentChanges: [],
  };
}
```

Each other collector follows the same pattern with its own office name and expected agent count.

```typescript
// lib/executive-intelligence/collectors/research-collector.ts
import { WorkforcePlatform } from '../../workforce/workforce-platform';
import { OfficeStatus } from '../types';

export function collectResearchStatus(workforce: WorkforcePlatform): OfficeStatus {
  const agents = workforce.listAgentsByOffice('Research Office');
  return {
    office: 'Research Office',
    health: agents.length === 4 ? 'healthy' : 'attention',
    agentCount: agents.length,
    activeTasks: agents.reduce((sum, a) => sum + workforce.getAgentTasks(a.agentId).length, 0),
    blockers: [],
    recentChanges: [],
  };
}
```

```typescript
// lib/executive-intelligence/collectors/product-collector.ts
import { WorkforcePlatform } from '../../workforce/workforce-platform';
import { OfficeStatus } from '../types';

export function collectProductStatus(workforce: WorkforcePlatform): OfficeStatus {
  const agents = workforce.listAgentsByOffice('Product Office');
  return {
    office: 'Product Office',
    health: agents.length === 5 ? 'healthy' : 'attention',
    agentCount: agents.length,
    activeTasks: agents.reduce((sum, a) => sum + workforce.getAgentTasks(a.agentId).length, 0),
    blockers: [],
    recentChanges: [],
  };
}
```

```typescript
// lib/executive-intelligence/collectors/operations-collector.ts
import { WorkforcePlatform } from '../../workforce/workforce-platform';
import { OfficeStatus } from '../types';

export function collectOperationsStatus(workforce: WorkforcePlatform): OfficeStatus {
  const agents = workforce.listAgentsByOffice('Operations Office');
  return {
    office: 'Operations Office',
    health: agents.length === 5 ? 'healthy' : 'attention',
    agentCount: agents.length,
    activeTasks: agents.reduce((sum, a) => sum + workforce.getAgentTasks(a.agentId).length, 0),
    blockers: [],
    recentChanges: [],
  };
}
```

```typescript
// lib/executive-intelligence/collectors/knowledge-collector.ts
import { WorkforcePlatform } from '../../workforce/workforce-platform';
import { OfficeStatus } from '../types';

export function collectKnowledgeStatus(workforce: WorkforcePlatform): OfficeStatus {
  const agents = workforce.listAgentsByOffice('Knowledge Office');
  return {
    office: 'Knowledge Office',
    health: agents.length === 4 ? 'healthy' : 'attention',
    agentCount: agents.length,
    activeTasks: agents.reduce((sum, a) => sum + workforce.getAgentTasks(a.agentId).length, 0),
    blockers: [],
    recentChanges: [],
  };
}
```

```typescript
// lib/executive-intelligence/collectors/index.ts
export { collectExecutiveStatus } from './executive-collector';
export { collectResearchStatus } from './research-collector';
export { collectProductStatus } from './product-collector';
export { collectOperationsStatus } from './operations-collector';
export { collectKnowledgeStatus } from './knowledge-collector';
```

**Step 4: Run to verify pass**

Run: `npx vitest run tests/executive-intelligence/executive-intelligence.test.ts 2>&1`
Expected: PASS (9 tests — 4 type + 5 collector)

**Step 5: Commit**

```bash
git add lib/executive-intelligence/collectors/ tests/executive-intelligence/executive-intelligence.test.ts
git commit -m "feat(eis): add office collectors — all 5 offices report status via WorkforcePlatform"
```

---

### Task 3: ExecutiveSnapshot Builder

**Files:**
- Create: `lib/executive-intelligence/executive-snapshot.ts`
- Modify: `tests/executive-intelligence/executive-intelligence.test.ts`

**Step 1: Write the failing test**

```typescript
import { buildSnapshot } from '../../lib/executive-intelligence/executive-snapshot';

describe('EIS Snapshot', () => {
  it('buildSnapshot collects all 5 offices into a snapshot', () => {
    const workforce = new WorkforcePlatformImpl();
    new ExecutiveOffice(workforce).deploy();
    new ResearchOffice(workforce).deploy();
    new ProductOffice(workforce).deploy();
    new OperationsOffice(workforce).deploy();
    new KnowledgeOffice(workforce).deploy();

    const snapshot = buildSnapshot(workforce);
    expect(snapshot.snapshotId).toBeDefined();
    expect(snapshot.timestamp).toBeGreaterThan(0);
    expect(Object.keys(snapshot.offices).length).toBe(5);
    expect(snapshot.offices['Executive Office'].health).toBe('healthy');
    expect(snapshot.offices['Research Office'].agentCount).toBe(4);
    expect(snapshot.pendingDecisions).toEqual([]);
    expect(snapshot.escalatedRisks).toEqual([]);
  });

  it('snapshot captures blockers when tasks exist', () => {
    const workforce = new WorkforcePlatformImpl();
    new ExecutiveOffice(workforce).deploy();
    new ResearchOffice(workforce).deploy();
    new ProductOffice(workforce).deploy();
    new OperationsOffice(workforce).deploy();
    new KnowledgeOffice(workforce).deploy();

    // Create a blocked task in Product Office
    workforce.createTask({
      taskId: '', type: 'roadmap-change', summary: 'Blocked release', assignedTo: 'PROD-RMAP-001',
      assignedBy: 'Director of Product', status: 'blocked', priority: 4,
      dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const snapshot = buildSnapshot(workforce);
    const prod = snapshot.offices['Product Office'];
    expect(prod.blockers.length).toBeGreaterThanOrEqual(1);
  });
});
```

**Step 2: Run to verify failure**

Run: `npx vitest run tests/executive-intelligence/ 2>&1`
Expected: FAIL — buildSnapshot not found

**Step 3: Write minimal implementation**

```typescript
// lib/executive-intelligence/executive-snapshot.ts
import { WorkforcePlatform } from '../workforce/workforce-platform';
import { ExecutiveSnapshot, OfficeStatus } from './types';
import { collectExecutiveStatus } from './collectors/executive-collector';
import { collectResearchStatus } from './collectors/research-collector';
import { collectProductStatus } from './collectors/product-collector';
import { collectOperationsStatus } from './collectors/operations-collector';
import { collectKnowledgeStatus } from './collectors/knowledge-collector';

let snapshotCounter = 0;

export function buildSnapshot(workforce: WorkforcePlatform): ExecutiveSnapshot {
  snapshotCounter++;
  const collectors = [
    collectExecutiveStatus,
    collectResearchStatus,
    collectProductStatus,
    collectOperationsStatus,
    collectKnowledgeStatus,
  ];

  const offices: Record<string, OfficeStatus> = {};
  const pendingDecisions: ExecutiveSnapshot['pendingDecisions'] = [];
  const escalatedRisks: ExecutiveSnapshot['escalatedRisks'] = [];

  for (const collect of collectors) {
    const status = collect(workforce);
    offices[status.office] = status;

    // Detect blocked tasks as blockers
    const agents = workforce.listAgentsByOffice(status.office);
    for (const agent of agents) {
      const tasks = workforce.getAgentTasks(agent.agentId);
      for (const task of tasks) {
        if (task.status === 'blocked') {
          status.blockers.push(`${task.summary} (${task.taskId})`);
        }
      }
    }
  }

  return {
    snapshotId: `snap-${snapshotCounter}`,
    timestamp: Date.now(),
    offices,
    pendingDecisions,
    escalatedRisks,
  };
}
```

**Step 4: Run to verify pass**

Run: `npx vitest run tests/executive-intelligence/ 2>&1`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/executive-intelligence/executive-snapshot.ts
git commit -m "feat(eis): add ExecutiveSnapshot builder — collects all 5 offices into canonical state"
```

---

### Task 4: Intelligence Engine

**Files:**
- Create: `lib/executive-intelligence/intelligence-engine.ts`
- Modify: `tests/executive-intelligence/executive-intelligence.test.ts`

**Step 1: Write the failing test**

```typescript
import { ExecutiveIntelligence } from '../../lib/executive-intelligence/intelligence-engine';

describe('EIS Intelligence Engine', () => {
  it('produces briefing from snapshot', () => {
    const workforce = new WorkforcePlatformImpl();
    new ExecutiveOffice(workforce).deploy();
    new ResearchOffice(workforce).deploy();
    new ProductOffice(workforce).deploy();
    new OperationsOffice(workforce).deploy();
    new KnowledgeOffice(workforce).deploy();

    const engine = new ExecutiveIntelligence(workforce);
    const briefing = engine.refreshAndBrief();

    expect(briefing.summary).toBeDefined();
    expect(briefing.organizationHealth.overall).toBe('healthy');
    expect(briefing.officeStatus['Executive Office']).toBeDefined();
    expect(briefing.officeStatus['Research Office']).toBeDefined();
    expect(briefing.officeStatus['Product Office']).toBeDefined();
    expect(briefing.officeStatus['Operations Office']).toBeDefined();
    expect(briefing.officeStatus['Knowledge Office']).toBeDefined();
    expect(briefing.metadata.confidence).toBeGreaterThan(0);
    expect(briefing.metadata.sources.length).toBe(5);
  });

  it('detects critical health when agents missing', () => {
    const workforce = new WorkforcePlatformImpl();
    // Deploy only 1 office — others are missing
    new ExecutiveOffice(workforce).deploy();

    const engine = new ExecutiveIntelligence(workforce);
    const briefing = engine.refreshAndBrief();

    expect(briefing.organizationHealth.overall).toBe('critical');
    expect(briefing.organizationHealth.offices['Research Office']).toBe('unknown');
  });

  it('escalated risks appear in activeRisks and recommendations', () => {
    const workforce = new WorkforcePlatformImpl();
    new ProductOffice(workforce).deploy();

    // Create a critical escalation on OPS-DEPLOY-001
    // (simulated by creating a blocked high-priority task)
    workforce.createTask({
      taskId: '', type: 'deployment-blocked', summary: 'Production deployment blocked by failed gate',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 5, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    // Re-deploy all offices for full snapshot
    const workforce2 = new WorkforcePlatformImpl();
    new ExecutiveOffice(workforce2).deploy();
    new ResearchOffice(workforce2).deploy();
    new ProductOffice(workforce2).deploy();
    new OperationsOffice(workforce2).deploy();
    new KnowledgeOffice(workforce2).deploy();
    // Move the blocked task into workforce2
    workforce2.createTask({
      taskId: '', type: 'deployment-blocked', summary: 'Production deployment blocked by failed gate',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 5, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const engine = new ExecutiveIntelligence(workforce2);
    const briefing = engine.refreshAndBrief();
    expect(briefing.activeRisks.length).toBeGreaterThanOrEqual(1);
    expect(briefing.recommendations.length).toBeGreaterThanOrEqual(1);
  });
});
```

**Step 2: Run to verify failure**

Run: `npx vitest run tests/executive-intelligence/ 2>&1`
Expected: FAIL — ExecutiveIntelligence not found

**Step 3: Write minimal implementation**

```typescript
// lib/executive-intelligence/intelligence-engine.ts
import { WorkforcePlatform } from '../workforce/workforce-platform';
import { buildSnapshot } from './executive-snapshot';
import { ExecutiveSnapshot, ExecutiveBriefing, EISRecommendation, OfficeHealth, KpiTrend, EscalatedRisk } from './types';

export class ExecutiveIntelligence {
  private lastSnapshot: ExecutiveSnapshot | null = null;

  constructor(private readonly workforce: WorkforcePlatform) {}

  refreshSnapshot(): ExecutiveSnapshot {
    this.lastSnapshot = buildSnapshot(this.workforce);
    return this.lastSnapshot;
  }

  refreshAndBrief(): ExecutiveBriefing {
    const snapshot = this.refreshSnapshot();
    return this.synthesize(snapshot);
  }

  getOrganizationalHealth(): { overall: OfficeHealth; offices: Record<string, OfficeHealth> } {
    const snapshot = this.lastSnapshot || this.refreshSnapshot();
    return this.assessHealth(snapshot);
  }

  getActiveRisks(): EscalatedRisk[] {
    const snapshot = this.lastSnapshot || this.refreshSnapshot();
    return this.deriveRisks(snapshot);
  }

  getPendingDecisions(): ExecutiveBriefing['pendingDecisions'] {
    const snapshot = this.lastSnapshot || this.refreshSnapshot();
    return snapshot.pendingDecisions;
  }

  getKpiTrends(): { improving: KpiTrend[]; declining: KpiTrend[] } {
    return { improving: [], declining: [] };
  }

  getRecommendations(): EISRecommendation[] {
    const snapshot = this.lastSnapshot || this.refreshSnapshot();
    return this.deriveRecommendations(snapshot);
  }

  getCeoBriefing(): ExecutiveBriefing {
    return this.refreshAndBrief();
  }

  private synthesize(snapshot: ExecutiveSnapshot): ExecutiveBriefing {
    const health = this.assessHealth(snapshot);
    const risks = this.deriveRisks(snapshot);
    const recommendations = this.deriveRecommendations(snapshot);
    const blockedItems = Object.entries(snapshot.offices)
      .filter(([_, s]) => s.blockers.length > 0)
      .map(([office, s]) => ({ office, blockers: s.blockers }));

    const summary = risks.length > 0
      ? `${risks.length} active risk(s) requiring attention`
      : 'Organization operating normally';

    return {
      summary,
      organizationHealth: health,
      priorities: risks.filter(r => r.severity === 'critical').map(r => r.description),
      activeRisks: risks,
      blockedItems,
      pendingDecisions: snapshot.pendingDecisions,
      kpiTrends: { improving: [], declining: [] },
      recommendations,
      officeStatus: Object.fromEntries(
        Object.entries(snapshot.offices).map(([name, status]) => [name, status])
      ),
      metadata: {
        generatedAt: Date.now(),
        snapshotVersion: snapshot.snapshotId,
        confidence: risks.length > 0 ? 0.95 : 0.99,
        sources: Object.keys(snapshot.offices),
      },
    };
  }

  private assessHealth(snapshot: ExecutiveSnapshot): { overall: OfficeHealth; offices: Record<string, OfficeHealth> } {
    const offices: Record<string, OfficeHealth> = {};
    let hasCritical = false;
    let hasAttention = false;

    const expectedOffices = ['Executive Office', 'Research Office', 'Product Office', 'Operations Office', 'Knowledge Office'];
    for (const name of expectedOffices) {
      const status = snapshot.offices[name];
      if (!status) {
        offices[name] = 'unknown';
        hasCritical = true;
        continue;
      }
      if (status.blockers.length > 0) {
        offices[name] = status.blockers.some(b => b.includes('critical') || b.includes('Production')) ? 'critical' : 'attention';
        if (offices[name] === 'critical') hasCritical = true;
        else hasAttention = true;
      } else if (status.agentCount === 0) {
        offices[name] = 'unknown';
        hasCritical = true;
      } else {
        offices[name] = 'healthy';
      }
    }

    const overall: OfficeHealth = hasCritical ? 'critical' : hasAttention ? 'attention' : 'healthy';
    return { overall, offices };
  }

  private deriveRisks(snapshot: ExecutiveSnapshot): EscalatedRisk[] {
    const risks: EscalatedRisk[] = [];
    for (const [office, status] of Object.entries(snapshot.offices)) {
      for (const blocker of status.blockers) {
        risks.push({
          id: `risk-${risks.length + 1}`,
          office,
          severity: blocker.includes('critical') || blocker.includes('Production') ? 'critical' : 'high',
          description: blocker,
          raisedAt: snapshot.timestamp,
        });
      }
    }
    return risks;
  }

  private deriveRecommendations(snapshot: ExecutiveSnapshot): EISRecommendation[] {
    const recs: EISRecommendation[] = [];
    for (const [office, status] of Object.entries(snapshot.offices)) {
      for (const blocker of status.blockers) {
        recs.push({
          priority: blocker.includes('critical') || blocker.includes('Production') ? 'critical' : 'high',
          action: `Resolve blocker in ${office}`,
          reason: blocker,
          office,
        });
      }
    }
    if (snapshot.pendingDecisions.length > 0) {
      recs.push({
        priority: 'medium',
        action: `Review ${snapshot.pendingDecisions.length} pending decision(s)`,
        reason: 'Requires executive attention',
        office: 'Executive Office',
      });
    }
    return recs;
  }
}
```

**Step 4: Run to verify pass**

Run: `npx vitest run tests/executive-intelligence/ 2>&1`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/executive-intelligence/intelligence-engine.ts
git commit -m "feat(eis): add Executive Intelligence Engine — synthesizes meaning from snapshots"
```

---

### Task 5: Integration Tests — Business Scenarios

**Files:**
- Create: `tests/executive-intelligence/scenarios.test.ts`
- Modify (if needed): `lib/executive-intelligence/intelligence-engine.ts`

**Step 1: Write the failing test**

```typescript
// tests/executive-intelligence/scenarios.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { ExecutiveOffice } from '../../lib/executive-office/executive-office';
import { ResearchOffice } from '../../lib/research-office/research-office';
import { ProductOffice } from '../../lib/product-office/product-office';
import { OperationsOffice } from '../../lib/operations-office/operations-office';
import { KnowledgeOffice } from '../../lib/knowledge-office/knowledge-office';
import { ExecutiveIntelligence } from '../../lib/executive-intelligence/intelligence-engine';

describe('EIS Business Scenarios', () => {
  let workforce: WorkforcePlatformImpl;
  let eis: ExecutiveIntelligence;

  beforeEach(() => {
    workforce = new WorkforcePlatformImpl();
    new ExecutiveOffice(workforce).deploy();
    new ResearchOffice(workforce).deploy();
    new ProductOffice(workforce).deploy();
    new OperationsOffice(workforce).deploy();
    new KnowledgeOffice(workforce).deploy();
    eis = new ExecutiveIntelligence(workforce);
  });

  it('normal operation: all offices healthy, briefing reflects that', () => {
    const briefing = eis.refreshAndBrief();
    expect(briefing.organizationHealth.overall).toBe('healthy');
    expect(briefing.activeRisks).toEqual([]);
    expect(briefing.blockedItems).toEqual([]);
    expect(briefing.recommendations.length).toBe(0);
    expect(briefing.metadata.confidence).toBeGreaterThan(0.9);
  });

  it('escalation: blocker in one office appears in risks and influences briefing', () => {
    workforce.createTask({
      taskId: '', type: 'deployment-blocked', summary: 'Production deployment blocked by failed gate',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 5, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const briefing = eis.refreshAndBrief();
    expect(briefing.organizationHealth.overall).toBe('critical');
    expect(briefing.activeRisks.length).toBeGreaterThanOrEqual(1);
    expect(briefing.blockedItems.length).toBeGreaterThanOrEqual(1);
    expect(briefing.recommendations.length).toBeGreaterThanOrEqual(1);
  });

  it('cross-office dependency: product delay caused by operations surfaces as linked concern', () => {
    // Operations blocker
    workforce.createTask({
      taskId: '', type: 'gate-failure', summary: 'Compliance gate failed for Bible Quest release',
      assignedTo: 'OPS-DEPLOY-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 4, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });
    // Product blocker dependent on operations
    workforce.createTask({
      taskId: '', type: 'release-blocked', summary: 'Cannot schedule release until operations gate passes',
      assignedTo: 'PROD-REL-001', assignedBy: 'Director of Product', status: 'blocked',
      priority: 4, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const briefing = eis.refreshAndBrief();
    expect(briefing.activeRisks.length).toBeGreaterThanOrEqual(2);
    expect(briefing.organizationHealth.overall).toBe('critical');
    // Both offices should show as affected
    const affectedOffices = briefing.blockedItems.map(b => b.office);
    expect(affectedOffices).toContain('Product Office');
    expect(affectedOffices).toContain('Operations Office');
  });

  it('governance: pending approval appears in pendingDecisions', () => {
    // Trigger a human review request
    workforce.requestHumanReview({
      requestId: '', agentId: 'EXEC-COMMS-001', actionType: 'draft-executive-communication',
      context: { draft: 'Q3 Strategy Update' }, mode: 'recommend',
      requestedAt: Date.now(), resolvedAt: null, resolution: null, resolvedBy: null,
    });

    const briefing = eis.refreshAndBrief();
    expect(briefing.pendingDecisions.length).toBeGreaterThanOrEqual(1);
    expect(briefing.recommendations.some(r => r.reason.includes('pending'))).toBe(true);
  });

  it('recommendations are first-class: synthesized from cross-office state', () => {
    workforce.createTask({
      taskId: '', type: 'milestone-delay', summary: 'MenWise360 milestone 3 behind schedule',
      assignedTo: 'OPS-PROJ-001', assignedBy: 'Director of Operations', status: 'blocked',
      priority: 4, dependencies: [], humanApprovalRequired: false,
      created: Date.now(), accepted: null, completed: null, auditTrail: [],
    });

    const briefing = eis.refreshAndBrief();
    expect(briefing.recommendations.length).toBeGreaterThan(0);
    expect(briefing.recommendations[0].action).toBeDefined();
    expect(briefing.recommendations[0].priority).toBeDefined();
    expect(briefing.recommendations[0].office).toBeDefined();
  });
});
```

**Step 2: Run to verify failure**

Run: `npx vitest run tests/executive-intelligence/scenarios.test.ts 2>&1`
Expected: FAIL — some assertions should fail because the intelligence engine may not handle all edge cases yet

**Step 3: Run and refine**

Run the test, observe which assertions fail, refine the intelligence engine logic to handle each scenario. Then run again until all pass.

**Step 4: Verify all pass**

Run: `npx vitest run tests/executive-intelligence/ 2>&1`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add tests/executive-intelligence/scenarios.test.ts lib/executive-intelligence/intelligence-engine.ts
git commit -m "test(eis): add business scenario integration tests — normal, escalation, cross-office, governance, recommendations"
```

---

### Task 6: Public API — getExecutiveBriefing(role)

**Files:**
- Create: `lib/executive-intelligence/index.ts`
- Modify: `tests/executive-intelligence/executive-intelligence.test.ts`

**Step 1: Write the failing test**

Add to existing test:

```typescript
import { createExecutiveIntelligence } from '../../lib/executive-intelligence';

describe('EIS Public API', () => {
  it('createExecutiveIntelligence returns configured EIS', () => {
    const workforce = new WorkforcePlatformImpl();
    new ExecutiveOffice(workforce).deploy();
    new ResearchOffice(workforce).deploy();
    new ProductOffice(workforce).deploy();
    new OperationsOffice(workforce).deploy();
    new KnowledgeOffice(workforce).deploy();

    const eis = createExecutiveIntelligence(workforce);
    const briefing = eis.refreshAndBrief();
    expect(briefing.summary).toBeDefined();
    expect(briefing.metadata.sources.length).toBe(5);
  });

  it('getExecutiveBriefing returns briefing for specified role', () => {
    const workforce = new WorkforcePlatformImpl();
    new ExecutiveOffice(workforce).deploy();
    new ResearchOffice(workforce).deploy();
    new ProductOffice(workforce).deploy();
    new OperationsOffice(workforce).deploy();
    new KnowledgeOffice(workforce).deploy();

    const eis = createExecutiveIntelligence(workforce);
    const ceoBriefing = eis.getExecutiveBriefing('CEO');
    expect(ceoBriefing.summary).toBeDefined();

    // Default (no role) returns same as CEO
    const defaultBriefing = eis.getCeoBriefing();
    expect(defaultBriefing.summary).toBe(ceoBriefing.summary);
  });
});
```

**Step 2: Run to verify failure**

Run: `npx vitest run tests/executive-intelligence/ 2>&1`
Expected: FAIL — createExecutiveIntelligence not found

**Step 3: Write minimal implementation**

```typescript
// lib/executive-intelligence/index.ts
import { WorkforcePlatform } from '../workforce/workforce-platform';
import { ExecutiveIntelligence } from './intelligence-engine';
import { ExecutiveBriefing } from './types';

export { ExecutiveIntelligence } from './intelligence-engine';
export * from './types';

export function createExecutiveIntelligence(workforce: WorkforcePlatform): ExecutiveIntelligence {
  return new ExecutiveIntelligence(workforce);
}

// Augment ExecutiveIntelligence with role-based briefing
declare module './intelligence-engine' {
  interface ExecutiveIntelligence {
    getExecutiveBriefing(role: string): ExecutiveBriefing;
  }
}
```

Actually, the augmentation won't work cleanly with classes. Better to add `getExecutiveBriefing` directly to the class in `intelligence-engine.ts`:

Add to `ExecutiveIntelligence` class:

```typescript
getExecutiveBriefing(role: string): ExecutiveBriefing {
  const briefing = this.refreshAndBrief();
  // In Phase 1, all roles return the same briefing
  // Future: customize by role (CEO, COO, CTO, Board)
  return briefing;
}
```

**Step 4: Run to verify pass**

Run: `npx vitest run tests/executive-intelligence/ 2>&1`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/executive-intelligence/index.ts lib/executive-intelligence/intelligence-engine.ts
git commit -m "feat(eis): add public API — createExecutiveIntelligence, getExecutiveBriefing(role)"
```

---

### Task 7: Full Regression

**Step 1: Run all tests**

Run: `npx vitest run 2>&1`
Expected: ALL PASS

**Step 2: Commit final**

```bash
git add -A
git commit -m "feat(eis): Phase 1 complete — Executive Intelligence Service operational

Deliverables:
- EIS types (ExecutiveSnapshot, ExecutiveBriefing, EISRecommendation)
- 5 office collectors (one per office)
- ExecutiveSnapshot builder (canonical state)
- Intelligence Engine (health, risks, recommendations)
- 5 business scenario integration tests
- Public API with getExecutiveBriefing(role)

Architecture: Workforce Platform → Collectors → Snapshot → Engine → Briefing"
```
