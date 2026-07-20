import { WorkforcePlatform } from '../workforce/workforce-platform';
import { buildSnapshot } from './executive-snapshot';
import { ExecutiveAnalysisEngine } from './analysis-engine';
import {
  ExecutiveSnapshot, ExecutiveBriefing, ExecutiveDelta, EISRecommendation,
  OfficeHealth, EscalatedRisk, CrossOfficeDependency, KpiTrend,
} from './types';

export class ExecutiveIntelligence {
  private lastSnapshot: ExecutiveSnapshot | null = null;
  private previousSnapshot: ExecutiveSnapshot | null = null;
  private readonly analysis: ExecutiveAnalysisEngine;

  constructor(private readonly workforce: WorkforcePlatform) {
    this.analysis = new ExecutiveAnalysisEngine();
  }

  refreshSnapshot(): ExecutiveSnapshot {
    this.previousSnapshot = this.lastSnapshot;
    this.lastSnapshot = buildSnapshot(this.workforce);
    return this.lastSnapshot;
  }

  getDelta(): ExecutiveDelta | null {
    if (!this.previousSnapshot || !this.lastSnapshot) return null;
    return this.analysis.computeDelta(this.previousSnapshot, this.lastSnapshot);
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

  getCrossOfficeDependencies(): CrossOfficeDependency[] {
    const snapshot = this.lastSnapshot || this.refreshSnapshot();
    return snapshot.crossOfficeDependencies;
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

  getExecutiveBriefing(role: string): ExecutiveBriefing {
    const briefing = this.refreshAndBrief();
    return briefing;
  }

  private synthesize(snapshot: ExecutiveSnapshot): ExecutiveBriefing {
    const health = this.assessHealth(snapshot);
    const risks = this.deriveRisks(snapshot);
    const recommendations = this.deriveRecommendations(snapshot);
    const rankedPriorities = this.analysis.rankPriorities(snapshot);
    const riskIntelligence = this.analysis.enrichRisks(snapshot);
    const structuredRecommendations = this.analysis.generateRecommendations(snapshot, riskIntelligence);
    const blockedItems = Object.entries(snapshot.offices)
      .filter(([_, s]) => s.blockers.length > 0)
      .map(([office, s]) => ({ office, blockers: s.blockers }));

    const criticalRisks = risks.filter(r => r.severity === 'critical');
    const summary = criticalRisks.length > 0
      ? `${criticalRisks.length} critical risk(s) requiring executive attention`
      : risks.length > 0
        ? `${risks.length} active risk(s) requiring attention`
        : 'Organization operating normally';

    return {
      summary,
      organizationHealth: health,
      priorities: rankedPriorities.length > 0
        ? rankedPriorities.map(p => `${p.rank}. ${p.title}`)
        : criticalRisks.map(r => r.description),
      rankedPriorities,
      riskIntelligence,
      activeRisks: risks,
      blockedItems,
      pendingDecisions: snapshot.pendingDecisions,
      crossOfficeDependencies: snapshot.crossOfficeDependencies,
      kpiTrends: { improving: [], declining: [] },
      recommendations,
      structuredRecommendations,
      officeStatus: Object.fromEntries(
        Object.entries(snapshot.offices).map(([name, status]) => [name, status])
      ),
      metadata: {
        generatedAt: Date.now(),
        snapshotVersion: snapshot.snapshotId,
        confidence: criticalRisks.length > 0 ? 0.9 : risks.length > 0 ? 0.95 : 0.99,
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
    if (snapshot.crossOfficeDependencies.some(d => d.status === 'blocked')) {
      recs.push({
        priority: 'high',
        action: 'Resolve cross-office dependencies blocking workflow',
        reason: `${snapshot.crossOfficeDependencies.filter(d => d.status === 'blocked').length} dependency chain(s) blocked`,
        office: 'Executive Office',
      });
    }
    return recs;
  }
}
