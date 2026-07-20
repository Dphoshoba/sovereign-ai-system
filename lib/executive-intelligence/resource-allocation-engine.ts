import {
  CapacityRecord, DemandRecord, AllocationRecord, AllocationConstraint,
  AllocationRecommendation, AllocationBriefingSection, RecommendationType,
} from './resource-allocation-types';
import { ProductDeploymentProfile } from './product-profile-types';

export class ResourceAllocationEngine {
  private capacities: Map<string, CapacityRecord> = new Map();
  private demands: Map<string, DemandRecord> = new Map();
  private allocations: Map<string, AllocationRecord> = new Map();
  private constraints: Map<string, AllocationConstraint> = new Map();

  registerCapacity(record: CapacityRecord): void {
    this.capacities.set(record.id, record);
  }

  registerCapacities(records: CapacityRecord[]): void {
    for (const r of records) {
      this.registerCapacity(r);
    }
  }

  registerDemand(record: DemandRecord): void {
    this.demands.set(record.id, record);
  }

  registerDemands(records: DemandRecord[]): void {
    for (const r of records) {
      this.registerDemand(r);
    }
  }

  registerAllocation(record: AllocationRecord): void {
    this.allocations.set(record.id, record);
  }

  registerAllocations(records: AllocationRecord[]): void {
    for (const r of records) {
      this.registerAllocation(r);
    }
  }

  registerConstraint(constraint: AllocationConstraint): void {
    this.constraints.set(constraint.id, constraint);
  }

  registerConstraints(constraints: AllocationConstraint[]): void {
    for (const c of constraints) {
      this.registerConstraint(c);
    }
  }

  // ── Queries ──

  getCapacityByOffice(officeId: string): CapacityRecord[] {
    return Array.from(this.capacities.values()).filter(c => c.officeId === officeId);
  }

  getAllCapacity(): CapacityRecord[] {
    return Array.from(this.capacities.values());
  }

  getDemandByProduct(productId: string): DemandRecord[] {
    return Array.from(this.demands.values()).filter(d => d.productId === productId);
  }

  getAllDemand(): DemandRecord[] {
    return Array.from(this.demands.values());
  }

  getAllConstraints(): AllocationConstraint[] {
    return Array.from(this.constraints.values());
  }

  getAllAllocations(): AllocationRecord[] {
    return Array.from(this.allocations.values());
  }

  getActiveAllocations(): AllocationRecord[] {
    return Array.from(this.allocations.values()).filter(a =>
      a.status === 'approved' || a.status === 'active'
    );
  }

  getAllocationSummary(): { totalAllocated: number; byOffice: Record<string, number> } {
    const active = this.getActiveAllocations();
    const totalAllocated = active.reduce((sum, a) => sum + a.allocatedUnits, 0);
    const byOffice: Record<string, number> = {};
    for (const a of active) {
      const cap = this.capacities.get(a.capacityId);
      if (cap) {
        byOffice[cap.officeId] = (byOffice[cap.officeId] || 0) + a.allocatedUnits;
      }
    }
    return { totalAllocated, byOffice };
  }

  getUtilizationReport(): AllocationBriefingSection['utilizationReport'] {
    const activeAllocations = this.getActiveAllocations();
    const officeAllocations: Record<string, { allocated: number; consumed: number | null; source: string }> = {};

    for (const a of activeAllocations) {
      const cap = this.capacities.get(a.capacityId);
      if (cap) {
        if (!officeAllocations[cap.officeId]) {
          officeAllocations[cap.officeId] = { allocated: 0, consumed: null, source: 'no-utilization-data' };
        }
        officeAllocations[cap.officeId].allocated += a.allocatedUnits;
      }
    }

    return Object.entries(officeAllocations).map(([officeId, data]) => ({
      officeId,
      allocatedUnits: data.allocated,
      consumedUnits: data.consumed,
      utilizationRate: data.consumed !== null && data.allocated > 0
        ? Math.round(data.consumed / data.allocated * 10000) / 100
        : null,
      source: data.source,
    }));
  }

  getUnmetDemand(): { demandId: string; productId: string; requiredUnits: number; allocatedUnits: number; unmetUnits: number }[] {
    return Array.from(this.demands.values()).map(d => {
      const allocated = Array.from(this.allocations.values())
        .filter(a => a.demandId === d.id && (a.status === 'approved' || a.status === 'active'))
        .reduce((sum, a) => sum + a.allocatedUnits, 0);
      return {
        demandId: d.id,
        productId: d.productId,
        requiredUnits: d.requiredUnits,
        allocatedUnits: allocated,
        unmetUnits: Math.max(0, d.requiredUnits - allocated),
      };
    });
  }

  getAllocationConstraints(): AllocationConstraint[] {
    return this.getAllConstraints();
  }

  // ── Advisory Recommendations (Milestone 3) ──

  getAllocationRecommendations(
    productProfiles: ProductDeploymentProfile[]
  ): AllocationRecommendation[] {
    const recs: AllocationRecommendation[] = [];
    const allCapacity = this.getAllCapacity();
    const allDemand = this.getAllDemand();
    const unmetDemand = this.getUnmetDemand().filter(u => u.unmetUnits > 0);
    const allConstraints = this.getAllConstraints();
    const utilizationReport = this.getUtilizationReport();

    // Constraint-first: check governance/dependency blockers
    const blockingConstraints = allConstraints.filter(c => c.severity === 'high' || c.severity === 'critical');

    for (const constraint of blockingConstraints) {
      const affectedProducts = constraint.productId ? [constraint.productId] : [];
      const affectedOffices = constraint.officeId ? [constraint.officeId] : [];

      // If a governance or dependency constraint exists, don't recommend adding capacity — recommend resolving the constraint first
      recs.push({
        type: 'resolve-constraint-first',
        priority: constraint.severity === 'critical' ? 'critical' : 'high',
        action: `Resolve ${constraint.type} constraint${constraint.initiativeId ? ` for initiative ${constraint.initiativeId}` : ''}`,
        supportingEvidence: [constraint.rationale],
        affectedProducts,
        affectedOffices,
        expectedBenefit: `Unblocks ${constraint.type.toLowerCase()} dependency`,
        identifiedTradeoff: 'Requires executive decision to resolve the blocking factor',
        confidence: 0.85,
        requiredExecutiveDecision: `Review and resolve ${constraint.type} constraint: ${constraint.rationale}`,
      });
    }

    // Check for unmet demand where no blocking constraint exists
    for (const unmet of unmetDemand) {
      const hasBlockingConstraint = allConstraints.some(c =>
        c.severity === 'high' || c.severity === 'critical' &&
        (c.initiativeId === this.demands.get(unmet.demandId)?.initiativeId ||
         c.productId === unmet.productId)
      );
      if (hasBlockingConstraint) continue;

      const demand = this.demands.get(unmet.demandId);
      if (!demand) continue;

      const officeCapacity = allCapacity.filter(c => c.officeId === demand.requestingOfficeId);
      const availableCapacity = officeCapacity.reduce((sum, c) => sum + c.availableUnits, 0);
      const allocatedToOffice = this.getActiveAllocations()
        .filter(a => officeCapacity.some(c => c.id === a.capacityId))
        .reduce((sum, a) => sum + a.allocatedUnits, 0);
      const remainingCapacity = availableCapacity - allocatedToOffice;

      if (remainingCapacity >= unmet.unmetUnits) {
        recs.push({
          type: 'increase-allocation',
          priority: demand.priority >= 4 ? 'high' : 'medium',
          action: `Increase allocation for ${demand.productId} — ${unmet.unmetUnits} unit(s) unmet in ${demand.requestingOfficeId}`,
          supportingEvidence: [
            `Required: ${unmet.requiredUnits}, Allocated: ${unmet.allocatedUnits}`,
            `Available capacity in ${demand.requestingOfficeId}: ${remainingCapacity} units`,
          ],
          affectedProducts: [demand.productId],
          affectedOffices: [demand.requestingOfficeId],
          expectedBenefit: `Covers ${Math.min(unmet.unmetUnits, remainingCapacity)} of ${unmet.unmetUnits} unmet units`,
          identifiedTradeoff: `Consumes ${Math.min(unmet.unmetUnits, remainingCapacity)} of ${remainingCapacity} available units in ${demand.requestingOfficeId}`,
          confidence: 0.8,
          requiredExecutiveDecision: `Approve allocation increase for ${demand.productId} initiative ${demand.initiativeId}`,
        });
      } else {
        // Not enough capacity — recommend rebalancing or deferring
        const otherDemands = allDemand.filter(d =>
          d.requestingOfficeId === demand.requestingOfficeId && d.id !== demand.id
        );

        if (otherDemands.length > 0 && remainingCapacity > 0) {
          recs.push({
            type: 'rebalance-initiatives',
            priority: 'medium',
            action: `Rebalance capacity in ${demand.requestingOfficeId} — partial allocation available for ${demand.productId}`,
            supportingEvidence: [
              `Unmet: ${unmet.unmetUnits}, Available: ${remainingCapacity}`,
              `Other demands: ${otherDemands.length} initiative(s) compete for same capacity`,
            ],
            affectedProducts: [demand.productId, ...otherDemands.map(d => d.productId)],
            affectedOffices: [demand.requestingOfficeId],
            expectedBenefit: `Partial coverage of ${unmet.productId} demand`,
            identifiedTradeoff: `Reduces capacity available for ${otherDemands.length} other initiative(s)`,
            confidence: 0.65,
            requiredExecutiveDecision: `Prioritize between ${demand.productId} and ${otherDemands.length} competing initiative(s) in ${demand.requestingOfficeId}`,
          });
        } else {
          recs.push({
            type: 'defer-initiative',
            priority: 'medium',
            action: `Consider deferring ${demand.productId} initiative — insufficient capacity in ${demand.requestingOfficeId}`,
            supportingEvidence: [
              `Required: ${unmet.requiredUnits}, Available: ${remainingCapacity}`,
              `Capacity fully committed in ${demand.requestingOfficeId}`,
            ],
            affectedProducts: [demand.productId],
            affectedOffices: [demand.requestingOfficeId],
            expectedBenefit: 'Aligns demand with available capacity',
            identifiedTradeoff: `Delays ${demand.productId} initiative`,
            confidence: 0.7,
            requiredExecutiveDecision: `Decide whether to defer ${demand.productId} initiative or reallocate from other products`,
          });
        }
      }
    }

    // If no issues, recommend preserving current allocation
    if (recs.length === 0) {
      recs.push({
        type: 'preserve-current',
        priority: 'low',
        action: 'Current allocation meets demand across all products',
        supportingEvidence: ['No unmet demand detected', 'No blocking constraints'],
        affectedProducts: productProfiles.map(p => p.productId),
        affectedOffices: [...new Set(allCapacity.map(c => c.officeId))],
        expectedBenefit: 'Maintains current delivery momentum',
        identifiedTradeoff: 'No capacity reserved for new initiatives',
        confidence: 0.9,
        requiredExecutiveDecision: 'Acknowledge current allocation state',
      });
    }

    return recs;
  }

  // ── Briefing Section (Milestone 4) ──

  buildAllocationBriefing(
    productProfiles: ProductDeploymentProfile[]
  ): AllocationBriefingSection {
    const allCapacity = this.getAllCapacity();
    const allDemand = this.getAllDemand();
    const activeAllocs = this.getActiveAllocations();
    const unmetDemandItems = this.getUnmetDemand();

    const totalCapacity = allCapacity.reduce((sum, c) => sum + c.availableUnits, 0);
    const totalDemand = allDemand.reduce((sum, d) => sum + d.requiredUnits, 0);
    const totalAllocated = activeAllocs.reduce((sum, a) => sum + a.allocatedUnits, 0);
    const allocationRate = totalCapacity > 0 ? Math.round(totalAllocated / totalCapacity * 10000) / 100 : 0;
    const totalUnmetDemand = unmetDemandItems.reduce((sum, u) => sum + u.unmetUnits, 0);

    // Capacity by office (no double counting — each capacity record belongs to one office)
    const capacityByOffice = [...new Set(allCapacity.map(c => c.officeId))].map(officeId => {
      const officeCap = allCapacity.filter(c => c.officeId === officeId);
      const availableUnits = officeCap.reduce((sum, c) => sum + c.availableUnits, 0);
      const allocatedUnits = activeAllocs
        .filter(a => officeCap.some(c => c.id === a.capacityId))
        .reduce((sum, a) => sum + a.allocatedUnits, 0);
      const constrained = this.constraints.size > 0 && Array.from(this.constraints.values()).some(c =>
        c.officeId === officeId && (c.severity === 'high' || c.severity === 'critical')
      );
      return {
        officeId,
        availableUnits,
        allocatedUnits,
        allocationRate: availableUnits > 0 ? Math.round(allocatedUnits / availableUnits * 10000) / 100 : 0,
        constrained,
      };
    });

    // Demand by product
    const demandByProduct = [...new Set(allDemand.map(d => d.productId))].map(productId => {
      const productDemands = allDemand.filter(d => d.productId === productId);
      const requiredUnits = productDemands.reduce((sum, d) => sum + d.requiredUnits, 0);
      const allocatedUnits = productDemands.map(d => d.id).reduce((sum, demandId) => {
        return sum + activeAllocs.filter(a => a.demandId === demandId).reduce((s, a) => s + a.allocatedUnits, 0);
      }, 0);
      return {
        productId,
        requiredUnits,
        allocatedUnits,
        unmetDemand: Math.max(0, requiredUnits - allocatedUnits),
      };
    });

    // Utilization report
    const utilizationReport = this.getUtilizationReport();

    // Constraints
    const constraints = this.getAllConstraints();

    // Recommendations
    const recommendations = this.getAllocationRecommendations(productProfiles);

    return {
      enterpriseSummary: {
        totalCapacity,
        totalDemand,
        totalAllocated,
        allocationRate,
        utilizationRate: null,
        unmetDemand: totalUnmetDemand,
        constraintCount: constraints.length,
      },
      capacityByOffice,
      demandByProduct,
      utilizationReport,
      constraints,
      recommendations,
    };
  }
}
