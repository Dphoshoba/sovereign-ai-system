import {
  CrossProductDependency, CrossProductConflict, CrossProductSynergy,
  OptimizationOpportunity, CoordinationBriefingSection, DependencyType,
} from './cross-product-types';
import { ProductDeploymentProfile } from './product-profile-types';

export class CrossProductEngine {
  private dependencies: Map<string, CrossProductDependency> = new Map();
  private conflicts: Map<string, CrossProductConflict> = new Map();
  private synergies: Map<string, CrossProductSynergy> = new Map();
  private registeredProducts: Set<string> = new Set();
  private registeredInitiatives: Set<string> = new Set();

  registerProducts(profiles: ProductDeploymentProfile[]): void {
    for (const p of profiles) {
      this.registeredProducts.add(p.productId);
    }
  }

  registerInitiativeIds(ids: string[]): void {
    for (const id of ids) {
      this.registeredInitiatives.add(id);
    }
  }

  // ── Dependency Graph (Milestone 1) ──

  registerDependency(dep: CrossProductDependency): void {
    this.validateProductRef(dep.sourceProductId);
    this.validateProductRef(dep.targetProductId);
    if (dep.sourceInitiativeId) this.validateInitiativeRef(dep.sourceInitiativeId);
    if (dep.targetInitiativeId) this.validateInitiativeRef(dep.targetInitiativeId);
    this.dependencies.set(dep.id, dep);
  }

  registerDependencies(deps: CrossProductDependency[]): void {
    for (const d of deps) {
      this.registerDependency(d);
    }
  }

  getDependencyGraph(): { nodes: string[]; edges: { source: string; target: string; type: DependencyType; status: string }[] } {
    const nodes = new Set<string>();
    const edges: { source: string; target: string; type: DependencyType; status: string }[] = [];
    for (const dep of this.dependencies.values()) {
      nodes.add(dep.sourceProductId);
      nodes.add(dep.targetProductId);
      edges.push({ source: dep.sourceProductId, target: dep.targetProductId, type: dep.type, status: dep.status });
    }
    return { nodes: Array.from(nodes), edges };
  }

  getTransitiveDependencies(productId: string): CrossProductDependency[] {
    const visited = new Set<string>();
    const result: CrossProductDependency[] = [];
    const queue = [productId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      for (const dep of this.dependencies.values()) {
        if (dep.sourceProductId === current && !visited.has(dep.targetProductId)) {
          result.push(dep);
          queue.push(dep.targetProductId);
        }
      }
    }
    return result;
  }

  getUpstreamBlockers(productId: string, initiativeId?: string): CrossProductDependency[] {
    return Array.from(this.dependencies.values()).filter(d =>
      d.targetProductId === productId &&
      d.status === 'blocked' &&
      (!initiativeId || d.targetInitiativeId === initiativeId)
    );
  }

  detectCycles(): string[][] {
    const graph = new Map<string, string[]>();
    for (const dep of this.dependencies.values()) {
      if (!graph.has(dep.sourceProductId)) graph.set(dep.sourceProductId, []);
      graph.get(dep.sourceProductId)!.push(dep.targetProductId);
    }

    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string) => {
      if (recStack.has(node)) {
        const cycleStart = path.indexOf(node);
        if (cycleStart >= 0) {
          cycles.push([...path.slice(cycleStart), node]);
        }
        return;
      }
      if (visited.has(node)) return;
      visited.add(node);
      recStack.add(node);
      path.push(node);
      const neighbors = graph.get(node) || [];
      for (const n of neighbors) {
        dfs(n);
      }
      path.pop();
      recStack.delete(node);
    };

    for (const node of graph.keys()) {
      dfs(node);
    }
    return cycles;
  }

  // ── Conflict Registry (Milestone 2) ──

  registerConflict(conflict: CrossProductConflict): void {
    for (const pid of conflict.productIds) {
      this.validateProductRef(pid);
    }
    for (const iid of conflict.initiativeIds) {
      this.validateInitiativeRef(iid);
    }
    this.conflicts.set(conflict.id, conflict);
  }

  registerConflicts(conflicts: CrossProductConflict[]): void {
    for (const c of conflicts) {
      this.registerConflict(c);
    }
  }

  getCrossProductConflicts(): CrossProductConflict[] {
    return Array.from(this.conflicts.values());
  }

  getConflictsByProduct(productId: string): CrossProductConflict[] {
    return Array.from(this.conflicts.values()).filter(c => c.productIds.includes(productId));
  }

  // ── Synergy Registry (Milestone 3) ──

  registerSynergy(synergy: CrossProductSynergy): void {
    if (synergy.evidenceIds.length === 0) {
      throw new Error(`Synergy ${synergy.id} requires at least one evidence ID`);
    }
    for (const pid of synergy.productIds) {
      this.validateProductRef(pid);
    }
    this.synergies.set(synergy.id, synergy);
  }

  registerSynergies(synergies: CrossProductSynergy[]): void {
    for (const s of synergies) {
      this.registerSynergy(s);
    }
  }

  getCrossProductSynergies(): CrossProductSynergy[] {
    return Array.from(this.synergies.values());
  }

  // ── Opportunity Engine (Milestone 4) ──

  getOptimizationOpportunities(): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // From blocked dependencies — sequence or resolve
    for (const dep of this.dependencies.values()) {
      if (dep.status === 'blocked') {
        opportunities.push({
          id: `opp-seq-${dep.id}`,
          type: 'sequence',
          affectedProductIds: [dep.sourceProductId, dep.targetProductId],
          affectedInitiativeIds: [dep.sourceInitiativeId, dep.targetInitiativeId].filter(Boolean) as string[],
          priority: 2,
          rationale: `Unblock dependency: ${dep.sourceProductId} → ${dep.targetProductId} (${dep.type})`,
          evidenceIds: [dep.id, ...dep.evidenceIds],
          expectedBenefit: `Enables ${dep.sourceProductId} to proceed`,
          tradeOffs: ['May require reprioritization of downstream work'],
          requiredDecision: `Resolve blocker or defer dependent initiatives`,
          confidence: dep.evidenceIds.length > 2 ? 0.85 : 0.65,
        });
      }
    }

    // From cycles — surfaced as risk
    const cycles = this.detectCycles();
    for (const cycle of cycles) {
      const cycleId = `cycle-${cycle.join('-')}`;
      opportunities.push({
        id: `opp-resolve-${cycleId}`,
        type: 'resolve_conflict',
        affectedProductIds: cycle.slice(0, -1),
        affectedInitiativeIds: [],
        priority: 1,
        rationale: `Cyclic dependency detected: ${cycle.join(' → ')}`,
        evidenceIds: [cycleId],
        expectedBenefit: 'Eliminates circular dependency risk',
        tradeOffs: ['May require redesign of dependency structure'],
        requiredDecision: `Review and break cycle: ${cycle.join(' → ')}`,
        confidence: 0.95,
      });
    }

    // From conflicts — rebalance or coordinate
    for (const conflict of this.conflicts.values()) {
      if (conflict.severity === 'high' || conflict.severity === 'critical') {
        const priority = conflict.severity === 'critical' ? 1 : 2;
        opportunities.push({
          id: `opp-coord-${conflict.id}`,
          type: 'coordinate',
          affectedProductIds: [...conflict.productIds],
          affectedInitiativeIds: [...conflict.initiativeIds],
          priority,
          rationale: `Resolve ${conflict.type}: ${conflict.rationale}`,
          evidenceIds: [conflict.id, ...conflict.evidenceIds],
          expectedBenefit: `Eliminates ${conflict.type} contention`,
          tradeOffs: ['One or more products may need to adjust schedule'],
          requiredDecision: `Prioritize between ${conflict.productIds.join(' and ')}`,
          confidence: conflict.evidenceIds.length > 1 ? 0.8 : 0.6,
        });
      }
    }

    // From synergies — reuse or consolidate
    for (const synergy of this.synergies.values()) {
      if (synergy.confidence >= 0.7) {
        const oppType = synergy.type === 'shared_workflow' || synergy.type === 'shared_capability' ? 'reuse' : 'consolidate';
        opportunities.push({
          id: `opp-${oppType}-${synergy.id}`,
          type: oppType,
          affectedProductIds: [...synergy.productIds],
          affectedInitiativeIds: synergy.initiativeIds ? [...synergy.initiativeIds] : [],
          priority: synergy.confidence >= 0.9 ? 2 : 3,
          rationale: `Reuse opportunity: ${synergy.type} across ${synergy.productIds.join(', ')}`,
          evidenceIds: [synergy.id, ...synergy.evidenceIds],
          expectedBenefit: synergy.expectedBenefit,
          tradeOffs: ['May require coordination overhead'],
          requiredDecision: `Approve shared ${synergy.type.replace('_', ' ')} across ${synergy.productIds.join(' and ')}`,
          confidence: synergy.confidence,
        });
      }
    }

    // Sort by priority (lower = higher urgency)
    opportunities.sort((a, b) => a.priority - b.priority || b.confidence - a.confidence);
    return opportunities;
  }

  // ── Coordination Briefing (Milestone 5) ──

  buildCoordinationBriefing(): CoordinationBriefingSection {
    const allDeps = Array.from(this.dependencies.values());
    const cycles = this.detectCycles();
    const transExpansions = allDeps
      .filter(d => d.type === 'requires' || d.type === 'enables')
      .reduce((sum, d) => sum + this.getTransitiveDependencies(d.sourceProductId).length, 0);

    return {
      dependencyGraph: {
        totalDependencies: allDeps.length,
        activeDependencies: allDeps.filter(d => d.status === 'active').length,
        blockedDependencies: allDeps.filter(d => d.status === 'blocked').length,
        resolvedDependencies: allDeps.filter(d => d.status === 'resolved').length,
        cyclicDependencyIds: cycles.map(c => `cycle:${c.join('→')}`),
        transitiveExpansions: transExpansions,
      },
      conflicts: this.getCrossProductConflicts(),
      synergies: this.getCrossProductSynergies(),
      optimizationOpportunities: this.getOptimizationOpportunities(),
    };
  }

  // ── Validation ──

  private validateProductRef(productId: string): void {
    if (!this.registeredProducts.has(productId)) {
      throw new Error(`Invalid product reference: ${productId}`);
    }
  }

  private validateInitiativeRef(initiativeId: string): void {
    if (!this.registeredInitiatives.has(initiativeId)) {
      throw new Error(`Invalid initiative reference: ${initiativeId}`);
    }
  }
}
