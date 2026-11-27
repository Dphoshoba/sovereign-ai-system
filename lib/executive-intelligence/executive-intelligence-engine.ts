import { ExecutiveDecision, EnterpriseHealth, StrategicIndicator, KpiSnapshot, ForecastProjection, DecisionQuality, GovernanceBottleneck, ExecutiveIntelligenceBriefing, DecisionStatus } from './executive-intelligence-types';

export class ExecutiveIntelligenceEngine {
  private decisions: Map<string, ExecutiveDecision[]> = new Map();
  private kpiSnapshots: Map<string, KpiSnapshot> = new Map();
  private indicators: Map<string, StrategicIndicator> = new Map();
  private forecasts: Map<string, ForecastProjection> = new Map();

  registerDecision(d: ExecutiveDecision): void {
    if (!this.decisions.has(d.id)) this.decisions.set(d.id, []);
    const existing = this.decisions.get(d.id)!;
    if (!existing.find(v => v.version === d.version)) existing.push(d);
  }

  getDecision(id: string, version?: number): ExecutiveDecision | undefined {
    const versions = this.decisions.get(id);
    if (!versions) return undefined;
    if (version !== undefined) return versions.find(d => d.version === version);
    return versions.reduce((latest, d) => d.version > latest.version ? d : latest, versions[0]);
  }

  getAllDecisions(): ExecutiveDecision[] {
    const result: ExecutiveDecision[] = [];
    for (const v of this.decisions.values()) result.push(...v);
    return result;
  }

  advanceDecision(id: string, newStatus: DecisionStatus): ExecutiveDecision | undefined {
    const current = this.getDecision(id);
    if (!current) return undefined;
    const updated: ExecutiveDecision = { ...current, version: current.version + 1, status: newStatus };
    const now = Date.now();
    switch (newStatus) {
      case 'discussed': updated.discussedAt = now; break;
      case 'approved': updated.approvedAt = now; break;
      case 'implemented': updated.implementedAt = now; break;
      case 'reviewed': updated.reviewedAt = now; break;
      case 'closed': updated.closedAt = now; break;
    }
    this.registerDecision(updated);
    return updated;
  }

  getRecentDecisions(count: number): ExecutiveDecision[] {
    const latest = new Map<string, ExecutiveDecision>();
    for (const [id, versions] of this.decisions) {
      const latestV = versions.reduce((max, v) => v.version > max.version ? v : max, versions[0]);
      latest.set(id, latestV);
    }
    return Array.from(latest.values())
      .sort((a, b) => b.proposedAt - a.proposedAt)
      .slice(0, count);
  }

  captureKpiSnapshot(snapshot: KpiSnapshot): void {
    this.kpiSnapshots.set(snapshot.id, snapshot);
  }

  getKpiSnapshots(): KpiSnapshot[] {
    return Array.from(this.kpiSnapshots.values());
  }

  registerIndicator(indicator: StrategicIndicator): void {
    this.indicators.set(indicator.id, indicator);
  }

  getStrategicIndicators(): StrategicIndicator[] {
    return Array.from(this.indicators.values());
  }

  addForecast(f: ForecastProjection): void {
    this.forecasts.set(f.id, f);
  }

  getForecasts(): ForecastProjection[] {
    return Array.from(this.forecasts.values());
  }

  generateProjection(title: string, baseValue: number, horizon: string, confidence: number, evidenceIds: string[]): ForecastProjection {
    return {
      id: `proj-${Date.now()}`,
      type: 'projection',
      title,
      description: `If nothing changes: ${title}`,
      value: baseValue,
      confidence,
      horizon,
      assumptions: ['Current conditions persist', 'No structural changes'],
      evidenceIds,
      generatedAt: Date.now(),
    };
  }

  generateForecast(title: string, trend: number, horizon: string, confidence: number, evidenceIds: string[]): ForecastProjection {
    return {
      id: `fcst-${Date.now()}`,
      type: 'forecast',
      title,
      description: `Given current trends: ${title}`,
      value: trend,
      confidence,
      horizon,
      assumptions: ['Trends continue at current rate', 'No significant market disruption'],
      evidenceIds,
      generatedAt: Date.now(),
    };
  }

  generateScenarioProjection(title: string, adjustedValue: number, horizon: string, scenarioId: string, evidenceIds: string[]): ForecastProjection {
    return {
      id: `scproj-${Date.now()}`,
      type: 'scenario',
      title,
      description: `If scenario ${scenarioId} adopted: ${title}`,
      value: adjustedValue,
      confidence: 0.6,
      horizon,
      assumptions: [`Scenario ${scenarioId} is adopted`, 'Assumptions hold'],
      evidenceIds,
      generatedAt: Date.now(),
    };
  }

  analyzeDecisionQuality(): DecisionQuality {
    const latest = new Map<string, ExecutiveDecision>();
    for (const [id, versions] of this.decisions) {
      const latestV = versions.reduce((max, v) => v.version > max.version ? v : max, versions[0]);
      latest.set(id, latestV);
    }
    const all = Array.from(latest.values());
    const approved = all.filter(d => d.status === 'approved' || d.status === 'implemented' || d.status === 'reviewed' || d.status === 'closed');
    const implemented = all.filter(d => d.status === 'implemented' || d.status === 'reviewed' || d.status === 'closed');
    const reviewed = all.filter(d => d.status === 'reviewed' || d.status === 'closed');

    const timeToDecide = approved
      .filter(d => d.approvedAt && d.proposedAt)
      .map(d => d.approvedAt! - d.proposedAt);

    const byCategory: Record<string, number> = {};
    for (const d of all) {
      byCategory[d.category] = (byCategory[d.category] || 0) + 1;
    }

    const overdue = all.filter(d => d.status === 'proposed' || d.status === 'discussed').length;

    return {
      totalDecisions: all.length,
      approvedDecisions: approved.length,
      implementedDecisions: implemented.length,
      reviewedDecisions: reviewed.length,
      averageTimeToDecision: timeToDecide.length > 0 ? timeToDecide.reduce((s, t) => s + t, 0) / timeToDecide.length : 0,
      decisionsByCategory: byCategory,
      overdueDecisions: overdue,
    };
  }

  detectGovernanceBottlenecks(): GovernanceBottleneck[] {
    const bottlenecks: GovernanceBottleneck[] = [];
    const latest = new Map<string, ExecutiveDecision>();
    for (const [id, versions] of this.decisions) {
      const latestV = versions.reduce((max, v) => v.version > max.version ? v : max, versions[0]);
      latest.set(id, latestV);
    }
    const pending = Array.from(latest.values()).filter(d => d.status === 'proposed' || d.status === 'discussed');
    if (pending.length > 3) {
      bottlenecks.push({
        id: 'bottleneck-pending',
        title: 'Decision backlog',
        description: `${pending.length} decisions awaiting advancement`,
        severity: pending.length > 7 ? 'critical' : pending.length > 5 ? 'high' : 'medium',
        affectedDecisions: pending.length,
        averageDelay: 0,
        recommendation: 'Schedule governance review session',
        evidenceIds: pending.map(d => d.id),
      });
    }
    return bottlenecks;
  }

  assessEnterpriseHealth(kpiCount: number, scenarioCount: number, decisionCount: number): EnterpriseHealth {
    const now = Date.now();
    return {
      overallScore: Math.min(1, (kpiCount * 0.05 + scenarioCount * 0.05 + decisionCount * 0.02)),
      portfolioHealth: Math.min(1, kpiCount * 0.1 + 0.1),
      resourceHealth: Math.min(1, decisionCount * 0.1 + 0.1),
      governanceHealth: Math.min(1, decisionCount * 0.05 + 0.3),
      learningHealth: Math.min(1, kpiCount * 0.05 + 0.2),
      strategicHealth: Math.min(1, scenarioCount * 0.1 + 0.1),
      assessedAt: now,
      evidenceIds: [],
    };
  }

  buildExecutiveBriefing(): ExecutiveIntelligenceBriefing {
    const kpis = this.getKpiSnapshots();
    const indicators = this.getStrategicIndicators();
    const recentDecisions = this.getRecentDecisions(10);
    const decisionQuality = this.analyzeDecisionQuality();
    const bottlenecks = this.detectGovernanceBottlenecks();
    const forecasts = this.getForecasts();
    const health = this.assessEnterpriseHealth(kpis.length, 0, recentDecisions.length);

    return {
      enterpriseHealth: health,
      kpiSnapshots: kpis,
      strategicIndicators: indicators,
      portfolioStatus: `${kpis.length} KPIs tracked, ${recentDecisions.length} recent decisions`,
      recentDecisions,
      decisionQuality,
      governanceBottlenecks: bottlenecks,
      forecasts,
      requiredExecutiveDecisions: bottlenecks.map(b => ({
        id: `req-${b.id}`,
        decision: `Address ${b.title.toLowerCase()}`,
        rationale: b.recommendation,
        priority: b.severity === 'critical' ? 1 : b.severity === 'high' ? 2 : 3,
      })),
      evidenceReferences: [...kpis.map(k => k.id), ...recentDecisions.map(d => d.id)],
      generatedAt: Date.now(),
    };
  }
}
