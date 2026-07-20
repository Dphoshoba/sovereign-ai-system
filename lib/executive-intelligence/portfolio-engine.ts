import { ExecutiveIntelligence } from './intelligence-engine';
import { ProductDeploymentProfile } from './product-profile-types';
import {
  PortfolioSnapshot, PortfolioBriefing, PortfolioHealth, PortfolioHealthDimension,
  PortfolioKpi, PortfolioKpiTarget, PortfolioKpiEvidence,
  PortfolioRisk, PortfolioDependency, PortfolioInitiative,
  ProductSummary, Scope, KpiCategory, KpiStatus,
} from './portfolio-types';
import { KpiDefinition, KpiMeasurement } from './kpi-registry-types';
import { KpiTrendEngine } from './kpi-trend-engine';
import {
  CapacityRecord, DemandRecord, AllocationRecord, AllocationConstraint,
  AllocationRecommendation, AllocationBriefingSection,
} from './resource-allocation-types';
import { ResourceAllocationEngine } from './resource-allocation-engine';
import {
  CrossProductDependency as CP_Dependency,
  CrossProductConflict, CrossProductSynergy, OptimizationOpportunity,
  CoordinationBriefingSection,
} from './cross-product-types';
import { CrossProductEngine } from './cross-product-engine';
import { OrganizationalLearningEngine } from './learning-engine';
import { LearningArtifact } from './learning-types';
import { StrategicPlanningEngine } from './strategy-engine';
import type { StrategicAssumption, StrategicScenario } from './strategy-types';
import { OfficeHealth } from './types';

export type EnterpriseRisksFromEis = PortfolioRisk[];
export type UnattributedItems = string[];
export type RecommendedAction = PortfolioBriefing['recommendedActions'][number];

export class PortfolioEngine {
  private lastSnapshot: PortfolioSnapshot | null = null;

  private productProfiles: Map<string, ProductDeploymentProfile> = new Map();
  private kpiTargets: Map<string, PortfolioKpiTarget> = new Map();
  private kpiEvidences: PortfolioKpiEvidence[] = [];
  private initiatives: PortfolioInitiative[] = [];
  private dependencies: PortfolioDependency[] = [];
  private productRisks: PortfolioRisk[] = [];

  private kpiDefinitions: Map<string, KpiDefinition> = new Map();
  private kpiMeasurements: KpiMeasurement[] = [];
  private readonly trendEngine = new KpiTrendEngine();
  private readonly allocationEngine = new ResourceAllocationEngine();
  private readonly crossProductEngine = new CrossProductEngine();
  private readonly learningEngine = new OrganizationalLearningEngine();
  private readonly planningEngine = new StrategicPlanningEngine();

  constructor(private readonly eis: ExecutiveIntelligence) {
    this.crossProductEngine.registerProducts(Array.from(this.productProfiles.values()));
  }

  registerProduct(profile: ProductDeploymentProfile): void {
    this.productProfiles.set(profile.productId, profile);
    this.crossProductEngine.registerProducts([profile]);
  }

  registerProduct(profile: ProductDeploymentProfile): void {
    this.productProfiles.set(profile.productId, profile);
    this.crossProductEngine.registerProducts([profile]);
  }

  registerProducts(profiles: ProductDeploymentProfile[]): void {
    for (const p of profiles) {
      this.registerProduct(p);
    }
  }

  registerKpiTarget(target: PortfolioKpiTarget): void {
    const key = `${target.productId}:${target.category}:${target.metric}`;
    this.kpiTargets.set(key, target);
  }

  registerKpiTargets(targets: PortfolioKpiTarget[]): void {
    for (const t of targets) {
      this.registerKpiTarget(t);
    }
  }

  submitKpiEvidence(evidence: PortfolioKpiEvidence): void {
    this.kpiEvidences.push(evidence);
  }

  registerInitiative(initiative: PortfolioInitiative): void {
    this.initiatives.push(initiative);
  }

  registerDependency(dependency: PortfolioDependency): void {
    this.dependencies.push(dependency);
  }

  submitProductRisk(risk: PortfolioRisk): void {
    this.productRisks.push(risk);
  }

  getProductCount(): number {
    return this.productProfiles.size;
  }

  registerAssumption(a: StrategicAssumption): void { this.planningEngine.registerAssumption(a); }
  registerScenario(s: StrategicScenario): void { this.planningEngine.registerScenario(s); }

  // ── KPI Definition Registry (Milestone 1) ──

  registerKpiDefinition(definition: KpiDefinition): void {
    this.kpiDefinitions.set(definition.id, definition);
  }

  registerKpiDefinitions(definitions: KpiDefinition[]): void {
    for (const d of definitions) {
      this.registerKpiDefinition(d);
    }
  }

  getKpiDefinition(id: string): KpiDefinition | undefined {
    return this.kpiDefinitions.get(id);
  }

  getKpiDefinitions(): KpiDefinition[] {
    return Array.from(this.kpiDefinitions.values());
  }

  // ── KPI Measurement Model (Milestone 2) ──

  submitKpiMeasurement(measurement: KpiMeasurement): void {
    this.kpiMeasurements.push(measurement);
  }

  submitKpiMeasurements(measurements: KpiMeasurement[]): void {
    for (const m of measurements) {
      this.submitKpiMeasurement(m);
    }
  }

  // ── Resource Allocation (Phase 3) ──

  registerCapacity(record: CapacityRecord): void {
    this.allocationEngine.registerCapacity(record);
  }

  registerCapacities(records: CapacityRecord[]): void {
    this.allocationEngine.registerCapacities(records);
  }

  registerDemand(record: DemandRecord): void {
    this.allocationEngine.registerDemand(record);
  }

  registerDemands(records: DemandRecord[]): void {
    this.allocationEngine.registerDemands(records);
  }

  registerAllocation(record: AllocationRecord): void {
    this.allocationEngine.registerAllocation(record);
  }

  registerAllocations(records: AllocationRecord[]): void {
    this.allocationEngine.registerAllocations(records);
  }

  registerConstraint(constraint: AllocationConstraint): void {
    this.allocationEngine.registerConstraint(constraint);
  }

  registerConstraints(constraints: AllocationConstraint[]): void {
    this.allocationEngine.registerConstraints(constraints);
  }

  getCapacityByOffice(officeId: string): CapacityRecord[] {
    return this.allocationEngine.getCapacityByOffice(officeId);
  }

  getDemandByProduct(productId: string): DemandRecord[] {
    return this.allocationEngine.getDemandByProduct(productId);
  }

  getAllocationSummary(): { totalAllocated: number; byOffice: Record<string, number> } {
    return this.allocationEngine.getAllocationSummary();
  }

  getUtilizationReport(): AllocationBriefingSection['utilizationReport'] {
    return this.allocationEngine.getUtilizationReport();
  }

  getUnmetDemand(): { demandId: string; productId: string; requiredUnits: number; allocatedUnits: number; unmetUnits: number }[] {
    return this.allocationEngine.getUnmetDemand();
  }

  getAllocationConstraints(): AllocationConstraint[] {
    return this.allocationEngine.getAllocationConstraints();
  }

  getAllocationRecommendations(): AllocationRecommendation[] {
    return this.allocationEngine.getAllocationRecommendations(Array.from(this.productProfiles.values()));
  }

  // ── Cross-Product Coordination (Phase 4) ──

  registerCrossProductDependency(dep: CP_Dependency): void {
    this.crossProductEngine.registerDependency(dep);
  }

  registerCrossProductDependencies(deps: CP_Dependency[]): void {
    this.crossProductEngine.registerDependencies(deps);
  }

  registerCrossProductConflict(conflict: CrossProductConflict): void {
    this.crossProductEngine.registerConflict(conflict);
  }

  registerCrossProductConflicts(conflicts: CrossProductConflict[]): void {
    this.crossProductEngine.registerConflicts(conflicts);
  }

  registerCrossProductSynergy(synergy: CrossProductSynergy): void {
    this.crossProductEngine.registerSynergy(synergy);
  }

  registerCrossProductSynergies(synergies: CrossProductSynergy[]): void {
    this.crossProductEngine.registerSynergies(synergies);
  }

  registerInitiativeIds(ids: string[]): void {
    this.crossProductEngine.registerInitiativeIds(ids);
  }

  getCrossProductDependencyGraph(): { nodes: string[]; edges: { source: string; target: string; type: import('./cross-product-types').DependencyType; status: string }[] } {
    return this.crossProductEngine.getDependencyGraph();
  }

  getUpstreamBlockers(productId: string, initiativeId?: string): CP_Dependency[] {
    return this.crossProductEngine.getUpstreamBlockers(productId, initiativeId);
  }

  getCrossProductConflicts(): CrossProductConflict[] {
    return this.crossProductEngine.getCrossProductConflicts();
  }

  getCrossProductSynergies(): CrossProductSynergy[] {
    return this.crossProductEngine.getCrossProductSynergies();
  }

  getOptimizationOpportunities(): OptimizationOpportunity[] {
    return this.crossProductEngine.getOptimizationOpportunities();
  }

  detectCycles(): string[][] {
    return this.crossProductEngine.detectCycles();
  }

  // ── Organizational Learning (Phase 5) ──

  registerLesson(artifact: LearningArtifact): void {
    this.learningEngine.registerLesson(artifact);
  }

  registerLessons(artifacts: LearningArtifact[]): void {
    this.learningEngine.registerLessons(artifacts);
  }

  // ── Enterprise Metric Queries (Milestone 4) ──

  getEnterpriseMetrics(): { definition: KpiDefinition; measurements: KpiMeasurement[]; trend: ReturnType<KpiTrendEngine['calculateTrend']> }[] {
    const results: { definition: KpiDefinition; measurements: KpiMeasurement[]; trend: ReturnType<KpiTrendEngine['calculateTrend']> }[] = [];
    for (const def of this.kpiDefinitions.values()) {
      for (const productId of this.getProductIdsForDefinition(def)) {
        const measurements = this.kpiMeasurements.filter(
          m => m.definitionId === def.id && m.productId === productId
        );
        if (measurements.length > 0) {
          const trend = this.trendEngine.calculateTrend(def, measurements);
          results.push({ definition: def, measurements, trend });
        }
      }
    }
    return results;
  }

  getMetricsByProduct(productId: string): { definition: KpiDefinition; measurements: KpiMeasurement[] }[] {
    const results: { definition: KpiDefinition; measurements: KpiMeasurement[] }[] = [];
    for (const def of this.kpiDefinitions.values()) {
      const measurements = this.kpiMeasurements.filter(
        m => m.definitionId === def.id && m.productId === productId
      );
      if (measurements.length > 0) {
        results.push({ definition: def, measurements });
      }
    }
    return results;
  }

  getMetricsByOffice(officeName: string): KpiDefinition[] {
    return Array.from(this.kpiDefinitions.values()).filter(d => d.ownerOffice === officeName);
  }

  getMetricsByCategory(category: KpiCategory): KpiDefinition[] {
    return Array.from(this.kpiDefinitions.values()).filter(d => d.category === category);
  }

  getMetricHistory(definitionId: string, productId: string): KpiMeasurement[] {
    return [...this.kpiMeasurements]
      .filter(m => m.definitionId === definitionId && m.productId === productId)
      .sort((a, b) => a.measuredAt - b.measuredAt);
  }

  getMetricDefinitions(): KpiDefinition[] {
    return this.getKpiDefinitions();
  }

  // ── Existing public API ──

  refreshPortfolioBriefing(): PortfolioBriefing {
    const briefing = this.eis.refreshAndBrief();
    const snapshot = this.buildSnapshot(briefing);
    this.lastSnapshot = snapshot;
    return this.analyze(snapshot);
  }

  getPortfolioHealth(): PortfolioHealth {
    if (!this.lastSnapshot) {
      this.refreshPortfolioBriefing();
    }
    const snapshot = this.lastSnapshot!;
    const portfolioHealth = this.computePortfolioHealth(snapshot);
    return portfolioHealth;
  }

  getProductSummaries(): ProductSummary[] {
    if (!this.lastSnapshot) {
      this.refreshPortfolioBriefing();
    }
    const snapshot = this.lastSnapshot!;
    return Array.from(this.productProfiles.values()).map(profile =>
      this.buildProductSummary(profile, snapshot)
    );
  }

  getEnterpriseRisks(): EnterpriseRisksFromEis {
    if (!this.lastSnapshot) {
      this.refreshPortfolioBriefing();
    }
    const snapshot = this.lastSnapshot!;
    return this.extractEnterpriseRisks(snapshot);
  }

  getCrossProductDependencies(): PortfolioDependency[] {
    return [...this.dependencies];
  }

  getPortfolioKpis(): PortfolioKpi[] {
    if (!this.lastSnapshot) {
      this.refreshPortfolioBriefing();
    }
    return this.computeAllKpis(this.lastSnapshot!);
  }

  getExecutivePortfolioBriefing(): PortfolioBriefing {
    return this.refreshPortfolioBriefing();
  }

  // ── Private methods ──

  private buildSnapshot(briefing: import('./types').ExecutiveBriefing): PortfolioSnapshot {
    return Object.freeze({
      generatedAt: Date.now(),
      executiveBriefing: Object.freeze({ ...briefing }),
      productProfiles: Object.freeze(Array.from(this.productProfiles.values())),
      kpiTargets: Object.freeze(Array.from(this.kpiTargets.values())),
      kpiEvidence: Object.freeze([...this.kpiEvidences]),
      initiatives: Object.freeze([...this.initiatives]),
      dependencies: Object.freeze([...this.dependencies]),
      productRisks: Object.freeze([...this.productRisks]),
    }) as PortfolioSnapshot;
  }

  private analyze(snapshot: PortfolioSnapshot): PortfolioBriefing {
    const portfolioHealth = this.computePortfolioHealth(snapshot);
    const productSummaries = Array.from(this.productProfiles.values()).map(profile =>
      this.buildProductSummary(profile, snapshot)
    );
    const enterpriseRisks = this.extractEnterpriseRisks(snapshot);
    const unattributed = this.extractUnattributedItems(snapshot);
    const allKpis = this.computeAllKpis(snapshot);
    const kpiSummary = this.summarizeKpis(allKpis);
    const metricsSection = this.buildMetricsSection(productSummaries);
    const allocationSection = this.allocationEngine.buildAllocationBriefing(Array.from(this.productProfiles.values()));
    const coordinationSection = this.crossProductEngine.buildCoordinationBriefing();
    const learningSection = this.learningEngine.buildLearningBriefing();
    const strategicSection = this.planningEngine.buildExecutivePlanningBrief();

    const strategicPriorities = [...snapshot.initiatives];
    const dependencies = [...snapshot.dependencies];
    const actions = this.deriveActions(productSummaries, enterpriseRisks, dependencies, strategicPriorities);

    const totalKpis = allKpis.length;
    const kpisWithEvidence = allKpis.filter(k => k.value !== null).length;

    const summary = this.buildExecutiveSummary(portfolioHealth, enterpriseRisks, productSummaries);

    return {
      generatedAt: Date.now(),
      portfolioHealth,
      executiveSummary: summary,
      productSummaries,
      enterpriseRisks,
      unattributedItems: unattributed,
      crossProductDependencies: dependencies,
      strategicPriorities,
      recommendedActions: actions,
      kpiSummary,
      metrics: metricsSection,
      allocation: allocationSection,
      coordination: coordinationSection,
      learning: learningSection,
      strategicPlanning: strategicSection,
      metadata: {
        generatedAt: Date.now(),
        productCount: this.productProfiles.size,
        initiativeCount: strategicPriorities.length,
        dependencyCount: dependencies.length,
        totalKpis,
        kpisWithEvidence,
      },
    };
  }

  private buildMetricsSection(summaries: ProductSummary[]): PortfolioBriefing['metrics'] {
    const definitions = this.getKpiDefinitions();
    const allMeasurements = this.kpiMeasurements;
    const trends = this.computeAllTrends();

    const definitionsWithProducts = definitions.filter(d =>
      d.applicableProducts.includes('*') || d.applicableProducts.some(p =>
        [...this.productProfiles.keys()].includes(p)
      )
    );

    const productsWithData = new Set(allMeasurements.map(m => m.productId));
    const metricsWithData = definitionsWithProducts.filter(d =>
      allMeasurements.some(m => m.definitionId === d.id)
    ).length;
    const metricsWithoutData = definitionsWithProducts.length - metricsWithData;

    const averageConfidence = allMeasurements.length > 0
      ? Math.round(allMeasurements.reduce((a, m) => a + m.confidence, 0) / allMeasurements.length * 100) / 100
      : 0;

    const categories = [...new Set(definitionsWithProducts.map(d => d.category))] as KpiCategory[];
    const categoryBreakdown = categories.map(category => {
      const catDefs = definitionsWithProducts.filter(d => d.category === category);
      const catTrends = Array.from(trends.values()).filter(t =>
        catDefs.some(d => d.id === t.definitionId)
      );
      return {
        category,
        metricCount: catDefs.length,
        averageConfidence: catTrends.length > 0
          ? Math.round(catTrends.reduce((a, t) => a + t.confidence, 0) / catTrends.length * 100) / 100
          : 0,
        improving: catTrends.filter(t => t.direction === 'improving').length,
        declining: catTrends.filter(t => t.direction === 'declining').length,
        stable: catTrends.filter(t => t.direction === 'stable').length,
        insufficientData: catTrends.filter(t => t.direction === 'insufficient_data').length,
      };
    });

    const productComparison = summaries.map(s => {
      const productDefs = definitionsWithProducts.filter(d =>
        d.applicableProducts.includes('*') || d.applicableProducts.includes(s.productId)
      );
      const productTrends = Array.from(trends.values()).filter(t => t.productId === s.productId);
      const productMeasurements = allMeasurements.filter(m => m.productId === s.productId);
      const metricsTargetMet = productTrends.filter(t => {
        if (t.currentValue === null) return false;
        const def = definitions.find(d => d.id === t.definitionId);
        if (!def) return false;
        const target = def.targetValue;
        if (target === undefined) return false;
        return def.targetType === 'higher_is_better' ? t.currentValue >= target : t.currentValue <= target;
      }).length;
      return {
        productId: s.productId,
        productName: s.productName,
        metricsReported: productDefs.length,
        metricsTargetMet,
        metricsAttention: productTrends.filter(t => t.direction === 'declining').length,
        metricsCritical: productTrends.filter(t => t.direction === 'declining' && t.currentValue !== null && t.previousValue !== null
          && Math.abs((t.currentValue - t.previousValue) / (t.previousValue || 1)) > 0.25).length,
        averageConfidence: productMeasurements.length > 0
          ? Math.round(productMeasurements.reduce((a, m) => a + m.confidence, 0) / productMeasurements.length * 100) / 100
          : 0,
      };
    });

    const metricsRequiringAttention = Array.from(trends.values())
      .filter(t => t.direction === 'declining')
      .map(t => {
        const def = definitions.find(d => d.id === t.definitionId);
        return {
          definitionId: t.definitionId,
          name: def?.name ?? t.definitionId,
          productId: t.productId,
          value: t.currentValue,
          target: def?.targetValue ?? null,
          trend: t.direction,
          confidence: t.confidence,
          rationale: t.rationale,
        };
      });

    return {
      enterpriseSummary: {
        totalDefinitions: definitionsWithProducts.length,
        totalMeasurements: allMeasurements.length,
        metricsWithData,
        metricsWithoutData,
        averageConfidence,
      },
      categoryBreakdown,
      productComparison,
      metricsRequiringAttention,
    };
  }

  private computeAllTrends(): Map<string, ReturnType<KpiTrendEngine['calculateTrend']>> {
    const trends = new Map<string, ReturnType<KpiTrendEngine['calculateTrend']>>();
    for (const def of this.kpiDefinitions.values()) {
      const products = this.getProductIdsForDefinition(def);
      for (const productId of products) {
        const measurements = this.kpiMeasurements.filter(
          m => m.definitionId === def.id && m.productId === productId
        );
        if (measurements.length > 0) {
          const trend = this.trendEngine.calculateTrend(def, measurements);
          trends.set(`${def.id}:${productId}`, trend);
        }
      }
    }
    return trends;
  }

  private getProductIdsForDefinition(def: KpiDefinition): string[] {
    if (def.applicableProducts.includes('*')) {
      return Array.from(this.productProfiles.keys());
    }
    return def.applicableProducts.filter(p => this.productProfiles.has(p));
  }

  private computePortfolioHealth(snapshot: PortfolioSnapshot): PortfolioHealth {
    const dimensions = {
      productCoverage: this.evaluateProductCoverage(),
      riskExposure: this.evaluateRiskExposure(snapshot),
      blockerSeverity: this.evaluateBlockerSeverity(snapshot),
      governanceStatus: this.evaluateGovernanceStatus(snapshot),
      deliveryMomentum: this.evaluateDeliveryMomentum(snapshot),
    };

    const statuses = Object.values(dimensions).map(d => d.status);
    const hasCritical = statuses.includes('critical');
    const hasAttention = statuses.includes('attention');
    const overall: OfficeHealth = hasCritical ? 'critical' : hasAttention ? 'attention' : 'healthy';

    const productHealthDistribution: Record<string, OfficeHealth> = {};
    const productRationale: Record<string, string[]> = {};
    for (const profile of this.productProfiles.values()) {
      const summary = this.buildProductSummary(profile, snapshot);
      productHealthDistribution[profile.productId] = summary.health;
      productRationale[profile.productId] = summary.rationale;
    }

    return { overall, dimensions, productHealthDistribution, productRationale };
  }

  private evaluateProductCoverage(): PortfolioHealthDimension {
    const count = this.productProfiles.size;
    if (count >= 5) return { status: 'healthy', rationale: [`All ${count} registered products reporting`] };
    if (count >= 3) return { status: 'attention', rationale: [`${count} of 5 products registered`] };
    return { status: 'critical', rationale: [`Only ${count} products registered — expected 5`] };
  }

  private evaluateRiskExposure(snapshot: PortfolioSnapshot): PortfolioHealthDimension {
    const briefing = snapshot.executiveBriefing;
    const eisRisks = briefing.activeRisks;
    const productRisks = snapshot.productRisks;
    const criticalCount = eisRisks.filter(r => r.severity === 'critical').length + productRisks.filter(r => r.severity === 'critical').length;
    const highCount = eisRisks.filter(r => r.severity === 'high').length + productRisks.filter(r => r.severity === 'high').length;
    if (criticalCount > 0) return { status: 'critical', rationale: [`${criticalCount} critical risk(s) active`] };
    if (highCount > 2) return { status: 'attention', rationale: [`${highCount} high-severity risk(s) active`] };
    if (highCount > 0) return { status: 'attention', rationale: [`${highCount} high-severity risk(s) active`] };
    return { status: 'healthy', rationale: ['No critical or high-severity risks'] };
  }

  private evaluateBlockerSeverity(snapshot: PortfolioSnapshot): PortfolioHealthDimension {
    const blockedItems = snapshot.executiveBriefing.blockedItems;
    const totalBlockers = blockedItems.reduce((sum, item) => sum + item.blockers.length, 0);
    const criticalBlockers = blockedItems.filter(item =>
      item.blockers.some(b => b.includes('critical') || b.includes('Production'))
    ).length;
    if (criticalBlockers > 0) return { status: 'critical', rationale: [`${criticalBlockers} critical blocker(s) in production`] };
    if (totalBlockers > 3) return { status: 'attention', rationale: [`${totalBlockers} active blocker(s)`] };
    if (totalBlockers > 0) return { status: 'attention', rationale: [`${totalBlockers} active blocker(s)`] };
    return { status: 'healthy', rationale: ['No blockers'] };
  }

  private evaluateGovernanceStatus(snapshot: PortfolioSnapshot): PortfolioHealthDimension {
    const pending = snapshot.executiveBriefing.pendingDecisions;
    const criticalPending = pending.filter(d => d.urgency === 'critical').length;
    if (criticalPending > 0) return { status: 'critical', rationale: [`${criticalPending} critical pending decision(s)`] };
    if (pending.length > 3) return { status: 'attention', rationale: [`${pending.length} pending decision(s)`] };
    if (pending.length > 0) return { status: 'attention', rationale: [`${pending.length} pending decision(s)`] };
    return { status: 'healthy', rationale: ['No pending governance decisions'] };
  }

  private evaluateDeliveryMomentum(snapshot: PortfolioSnapshot): PortfolioHealthDimension {
    const totalKpiEvidence = snapshot.kpiEvidence.length;
    const productsWithEvidence = new Set(snapshot.kpiEvidence.map(e => e.productId)).size;
    if (productsWithEvidence === 0) return { status: 'attention', rationale: ['No KPI evidence submitted yet'] };
    const expectedProducts = this.productProfiles.size;
    if (productsWithEvidence < expectedProducts) return { status: 'attention', rationale: [`${productsWithEvidence} of ${expectedProducts} products have submitted KPI evidence`] };
    return { status: 'healthy', rationale: [`All ${expectedProducts} products reporting KPI evidence`] };
  }

  private buildProductSummary(profile: ProductDeploymentProfile, snapshot: PortfolioSnapshot): ProductSummary {
    const productId = profile.productId;
    const kpis = this.computeProductKpis(productId, snapshot);
    const risks = [...snapshot.productRisks].filter(r => r.productId === productId);
    const activeInitiatives = [...snapshot.initiatives].filter(i =>
      i.productIds.includes(productId) && (i.status === 'planned' || i.status === 'in-progress')
    );
    const kpiStatuses = kpis.map(k => k.status);
    const hasCritical = kpiStatuses.includes('critical');
    const hasAttention = kpiStatuses.includes('attention');
    const hasUnknown = kpis.length > 0 && kpis.every(k => k.status === 'unavailable');
    const hasRisks = risks.some(r => r.severity === 'critical' || r.severity === 'high');

    let health: OfficeHealth;
    const rationale: string[] = [];

    if (kpis.length === 0) {
      health = 'unknown';
      rationale.push('No KPIs registered');
    } else if (hasUnknown && !hasCritical && !hasAttention) {
      health = 'unknown';
      rationale.push('All KPIs reporting unavailable — no runtime evidence');
    } else if (hasCritical) {
      health = 'critical';
      rationale.push(`${kpis.filter(k => k.status === 'critical').length} KPI(s) critical`);
    } else if (hasRisks) {
      health = 'attention';
      rationale.push(`${risks.filter(r => r.severity === 'critical' || r.severity === 'high').length} product risk(s) active`);
    } else if (hasAttention) {
      health = 'attention';
      rationale.push(`${kpis.filter(k => k.status === 'attention').length} KPI(s) requiring attention`);
    } else {
      health = 'healthy';
      rationale.push('All KPIs healthy');
    }

    const kpiCategoriesReported = new Set(kpis.filter(k => k.value !== null).map(k => k.category)).size;

    return { productId, productName: profile.productName, health, rationale, kpis, risks, activeInitiatives, kpiCategoriesReported };
  }

  private computeProductKpis(productId: string, snapshot: PortfolioSnapshot): PortfolioKpi[] {
    const productTargets = [...snapshot.kpiTargets].filter(t => t.productId === productId);
    const productEvidence = [...snapshot.kpiEvidence].filter(e => e.productId === productId);

    return productTargets.map(target => {
      const evidence = productEvidence.filter(e =>
        e.category === target.category && e.metric === target.metric
      );
      const latest = evidence.length > 0 ? evidence.reduce((a, b) => a.measuredAt > b.measuredAt ? a : b) : null;
      const value = latest !== null ? latest.value : null;
      const measuredAt = latest !== null ? latest.measuredAt : null;
      const source = latest !== null ? latest.source : 'kpi-target-definition';

      let status: KpiStatus;
      if (value === null) {
        status = 'unavailable';
      } else if (value >= target.target) {
        status = 'healthy';
      } else if (value >= target.target * 0.75) {
        status = 'attention';
      } else {
        status = 'critical';
      }

      return {
        productId,
        category: target.category as KpiCategory,
        metric: target.metric,
        value,
        target: target.target,
        unit: target.unit,
        status,
        source,
        measuredAt,
        description: target.description,
      };
    });
  }

  private computeAllKpis(snapshot: PortfolioSnapshot): PortfolioKpi[] {
    return Array.from(this.productProfiles.keys()).flatMap(productId =>
      this.computeProductKpis(productId, snapshot)
    );
  }

  private extractEnterpriseRisks(snapshot: PortfolioSnapshot): PortfolioRisk[] {
    const eisRisks: PortfolioRisk[] = snapshot.executiveBriefing.activeRisks.map((r, i) => ({
      id: `enterprise-risk-${i + 1}`,
      scope: 'enterprise' as Scope,
      severity: r.severity,
      description: r.description,
      affectedOffices: [r.office],
      raisedAt: r.raisedAt,
      source: 'eis',
    }));

    const registeredEnterpriseRisks: PortfolioRisk[] = [...snapshot.productRisks]
      .filter(r => r.scope === 'enterprise')
      .map(r => ({ ...r }));

    return [...eisRisks, ...registeredEnterpriseRisks];
  }

  private extractUnattributedItems(snapshot: PortfolioSnapshot): string[] {
    const items: string[] = [];
    const briefing = snapshot.executiveBriefing;
    for (const item of briefing.blockedItems) {
      for (const blocker of item.blockers) {
        const taskId = this.extractTaskId(blocker);
        if (!this.findProductForTask(taskId)) {
          items.push(`Blocker: ${blocker}`);
        }
      }
    }
    return items;
  }

  private extractTaskId(blocker: string): string | null {
    const match = blocker.match(/\(([^)]+)\)$/);
    return match ? match[1] : null;
  }

  private findProductForTask(taskId: string | null): string | null {
    if (!taskId) return null;
    for (const risk of this.productRisks) {
      if (risk.scope === 'product' && risk.productId) {
        const productDir = risk.productId.replace(/-/g, '');
        if (taskId.toLowerCase().includes(productDir)) return risk.productId;
      }
    }
    return null;
  }

  private summarizeKpis(kpis: PortfolioKpi[]): PortfolioBriefing['kpiSummary'] {
    const categories = [...new Set(kpis.map(k => k.category))] as KpiCategory[];
    return categories.map(category => {
      const catKpis = kpis.filter(k => k.category === category);
      return {
        category,
        total: catKpis.length,
        healthy: catKpis.filter(k => k.status === 'healthy').length,
        attention: catKpis.filter(k => k.status === 'attention').length,
        critical: catKpis.filter(k => k.status === 'critical').length,
        unavailable: catKpis.filter(k => k.status === 'unavailable').length,
      };
    });
  }

  private deriveActions(
    summaries: ProductSummary[],
    enterpriseRisks: PortfolioRisk[],
    dependencies: PortfolioDependency[],
    initiatives: PortfolioInitiative[]
  ): RecommendedAction[] {
    const actions: RecommendedAction[] = [];

    const criticalProducts = summaries.filter(s => s.health === 'critical');
    for (const p of criticalProducts) {
      actions.push({
        priority: 'critical',
        action: `Address critical health in ${p.productName}`,
        rationale: p.rationale.join('; '),
        supportingEvidence: p.kpis.filter(k => k.status === 'critical').map(k => `${k.metric}: ${k.value ?? 'unavailable'} (target: ${k.target})`),
        productId: p.productId,
      });
    }

    const criticalRisks = enterpriseRisks.filter(r => r.severity === 'critical');
    for (const r of criticalRisks) {
      actions.push({
        priority: 'critical',
        action: `Address: ${r.description}`,
        rationale: `Enterprise-wide critical risk`,
        supportingEvidence: [r.description],
      });
    }

    const blockedDeps = dependencies.filter(d => d.status === 'blocked');
    for (const d of blockedDeps) {
      actions.push({
        priority: 'high',
        action: `Resolve dependency: ${d.sourceProductId} → ${d.targetProductId}`,
        rationale: d.rationale,
        supportingEvidence: [`Dependency type: ${d.type}`],
      });
    }

    const blockedInitiatives = initiatives.filter(i => i.status === 'blocked');
    for (const i of blockedInitiatives) {
      actions.push({
        priority: 'high',
        action: `Unblock initiative: ${i.name}`,
        rationale: i.description,
        supportingEvidence: [`Products: ${i.productIds.join(', ')}`],
      });
    }

    const attentionProducts = summaries.filter(s => s.health === 'attention');
    for (const p of attentionProducts) {
      const attentionKpis = p.kpis.filter(k => k.status === 'attention');
      if (attentionKpis.length > 0) {
        actions.push({
          priority: 'medium',
          action: `Review attention-level KPIs for ${p.productName}`,
          rationale: p.rationale.join('; '),
          supportingEvidence: attentionKpis.map(k => `${k.metric}: ${k.value ?? 'unavailable'} (target: ${k.target})`),
          productId: p.productId,
        });
      }
    }

    return actions;
  }

  private buildExecutiveSummary(
    health: PortfolioHealth,
    enterpriseRisks: PortfolioRisk[],
    summaries: ProductSummary[]
  ): string {
    const parts: string[] = [];
    parts.push(`Portfolio health: ${health.overall}`);

    const criticalCount = summaries.filter(s => s.health === 'critical').length;
    const attentionCount = summaries.filter(s => s.health === 'attention').length;
    const healthyCount = summaries.filter(s => s.health === 'healthy').length;

    if (criticalCount > 0) {
      const criticalProducts = summaries.filter(s => s.health === 'critical').map(s => s.productName);
      parts.push(`${criticalCount} product(s) critical: ${criticalProducts.join(', ')}`);
    }
    if (attentionCount > 0) {
      const attentionProducts = summaries.filter(s => s.health === 'attention').map(s => s.productName);
      parts.push(`${attentionCount} product(s) require attention: ${attentionProducts.join(', ')}`);
    }
    if (healthyCount > 0) {
      parts.push(`${healthyCount} product(s) healthy`);
    }

    const criticalRisks = enterpriseRisks.filter(r => r.severity === 'critical');
    if (criticalRisks.length > 0) {
      parts.push(`${criticalRisks.length} critical enterprise risk(s)`);
    }

    return parts.join('. ');
  }
}
