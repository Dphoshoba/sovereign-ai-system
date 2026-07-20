import {
  ExecutiveSnapshot,
  RankedPriority,
  ScoringConfig,
  DEFAULT_SCORING_CONFIG,
  ScoreComponents,
  PendingDecision,
  CrossOfficeDependency,
  EscalatedRisk,
  OfficeStatus,
} from './types';

export class ExecutiveAnalysisEngine {
  constructor(private readonly scoringConfig: ScoringConfig = DEFAULT_SCORING_CONFIG) {}

  rankPriorities(snapshot: ExecutiveSnapshot): RankedPriority[] {
    const candidates: Array<{
      title: string;
      category: RankedPriority['category'];
      impact: number;
      urgency: number;
      dependencyWeight: number;
      governanceWeight: number;
      confidence: number;
      rationale: string[];
      affectedOffices: string[];
    }> = [];

    // Candidates from escalated risks
    for (const risk of snapshot.escalatedRisks) {
      candidates.push(this.scoreRisk(risk, snapshot));
    }

    // Candidates from blockers
    for (const [office, status] of Object.entries(snapshot.offices)) {
      for (const blocker of status.blockers) {
        candidates.push(this.scoreBlocker(blocker, office, status, snapshot));
      }
    }

    // Candidates from pending decisions
    for (const decision of snapshot.pendingDecisions) {
      if (decision.status === 'pending') {
        candidates.push(this.scoreDecision(decision, snapshot));
      }
    }

    // Candidates from cross-office dependencies
    for (const dep of snapshot.crossOfficeDependencies) {
      if (dep.status === 'blocked') {
        candidates.push(this.scoreDependency(dep, snapshot));
      }
    }

    if (candidates.length === 0) {
      return [];
    }

    const scored = candidates.map(c => this.computeComposite(c));
    scored.sort((a, b) => b.compositeScore - a.compositeScore);

    return scored.map((item, index) => ({
      id: `priority-${index + 1}`,
      rank: index + 1,
      title: item.title,
      category: item.category,
      compositeScore: Math.round(item.compositeScore * 100) / 100,
      components: item.components,
      confidence: Math.round(item.confidence * 100) / 100,
      rationale: item.rationale,
      affectedOffices: item.affectedOffices,
      timestamp: snapshot.timestamp,
    }));
  }

  private computeComposite(candidate: {
    title: string;
    category: RankedPriority['category'];
    impact: number;
    urgency: number;
    dependencyWeight: number;
    governanceWeight: number;
    confidence: number;
    rationale: string[];
    affectedOffices: string[];
  }): {
    title: string;
    category: RankedPriority['category'];
    compositeScore: number;
    components: ScoreComponents;
    confidence: number;
    rationale: string[];
    affectedOffices: string[];
  } {
    const { impactWeight, urgencyWeight, dependencyWeight: depWeight, governanceWeight: govWeight } = this.scoringConfig;

    let composite = (candidate.impact * impactWeight)
      + (candidate.urgency * urgencyWeight)
      + (candidate.dependencyWeight * depWeight)
      + (candidate.governanceWeight * govWeight);

    // Bonus for affecting 3+ offices
    if (candidate.affectedOffices.length >= 3) {
      composite = Math.min(composite + 0.05, 1.0);
    }

    return {
      title: candidate.title,
      category: candidate.category,
      compositeScore: composite,
      components: {
        impact: Math.round(candidate.impact * 100) / 100,
        urgency: Math.round(candidate.urgency * 100) / 100,
        dependencyWeight: Math.round(candidate.dependencyWeight * 100) / 100,
        governanceWeight: Math.round(candidate.governanceWeight * 100) / 100,
      },
      confidence: candidate.confidence,
      rationale: candidate.rationale,
      affectedOffices: candidate.affectedOffices,
    };
  }

  private scoreRisk(risk: EscalatedRisk, snapshot: ExecutiveSnapshot): {
    title: string;
    category: 'risk';
    impact: number;
    urgency: number;
    dependencyWeight: number;
    governanceWeight: number;
    confidence: number;
    rationale: string[];
    affectedOffices: string[];
  } {
    const impactMap: Record<string, number> = { low: 0.2, medium: 0.5, high: 0.8, critical: 1.0 };
    const urgencyMap: Record<string, number> = { low: 0.2, medium: 0.4, high: 0.7, critical: 1.0 };

    const impact = impactMap[risk.severity] ?? 0.5;
    const urgency = urgencyMap[risk.severity] ?? 0.5;

    const affectedOffices = this.findAffectedOffices(risk.description, snapshot);
    const depWeight = snapshot.crossOfficeDependencies.some(
      d => d.sourceOffice === risk.office && d.status === 'blocked'
    ) ? 0.7 : 0.2;

    return {
      title: risk.description,
      category: 'risk',
      impact,
      urgency,
      dependencyWeight: depWeight,
      governanceWeight: 0,
      confidence: 0.9,
      rationale: [
        `Severity: ${risk.severity}`,
        `Office: ${risk.office}`,
        `Affects ${affectedOffices.length} office(s)`,
      ],
      affectedOffices,
    };
  }

  private scoreBlocker(blocker: string, office: string, status: OfficeStatus, snapshot: ExecutiveSnapshot): {
    title: string;
    category: 'blocker';
    impact: number;
    urgency: number;
    dependencyWeight: number;
    governanceWeight: number;
    confidence: number;
    rationale: string[];
    affectedOffices: string[];
  } {
    const isCritical = blocker.includes('critical') || blocker.includes('Production');
    const impact = isCritical ? 1.0 : 0.6;
    const urgency = isCritical ? 1.0 : 0.5;

    const affectedOffices = this.findAffectedOffices(blocker, snapshot);
    const depDeps = snapshot.crossOfficeDependencies.filter(
      d => d.sourceOffice === office && d.description === blocker
    );
    const depWeight = depDeps.length > 0 ? 0.8 : 0.3;

    return {
      title: blocker,
      category: 'blocker',
      impact,
      urgency,
      dependencyWeight: depWeight,
      governanceWeight: 0,
      confidence: 0.85,
      rationale: [
        `Blocked in: ${office}`,
        `Critical: ${isCritical}`,
        `Affects ${affectedOffices.length} office(s) via dependencies`,
      ],
      affectedOffices,
    };
  }

  private scoreDecision(decision: PendingDecision, snapshot: ExecutiveSnapshot): {
    title: string;
    category: 'decision';
    impact: number;
    urgency: number;
    dependencyWeight: number;
    governanceWeight: number;
    confidence: number;
    rationale: string[];
    affectedOffices: string[];
  } {
    const urgencyMap: Record<string, number> = { low: 0.2, medium: 0.5, high: 0.8, critical: 1.0 };
    const urgency = urgencyMap[decision.urgency] ?? 0.5;
    const hoursOpen = (snapshot.timestamp - decision.requestedAt) / 3600000;
    const impact = Math.min(0.3 + (hoursOpen / 48) * 0.7, 1.0);

    return {
      title: `${decision.actionType} (${decision.office})`,
      category: 'decision',
      impact,
      urgency,
      dependencyWeight: 0.2,
      governanceWeight: 0.9,
      confidence: 0.75,
      rationale: [
        `Urgency: ${decision.urgency}`,
        `Required approver: ${decision.requiredApprover}`,
        `Open for ${Math.round(hoursOpen)}h`,
        `Status: ${decision.status}`,
      ],
      affectedOffices: [decision.office],
    };
  }

  private scoreDependency(dep: CrossOfficeDependency, _snapshot: ExecutiveSnapshot): {
    title: string;
    category: 'dependency';
    impact: number;
    urgency: number;
    dependencyWeight: number;
    governanceWeight: number;
    confidence: number;
    rationale: string[];
    affectedOffices: string[];
  } {
    const isBlocked = dep.status === 'blocked';
    const impact = isBlocked ? 0.7 : 0.3;
    const urgency = isBlocked ? 0.8 : 0.3;

    return {
      title: dep.description,
      category: 'dependency',
      impact,
      urgency,
      dependencyWeight: 1.0,
      governanceWeight: 0.2,
      confidence: 0.8,
      rationale: [
        `From: ${dep.sourceOffice} → ${dep.targetOffice}`,
        `Status: ${dep.status}`,
        `Blocks downstream workflow`,
      ],
      affectedOffices: [dep.sourceOffice, dep.targetOffice],
    };
  }

  private findAffectedOffices(text: string, snapshot: ExecutiveSnapshot): string[] {
    const offices: string[] = [];
    const officeNames = Object.keys(snapshot.offices);
    for (const name of officeNames) {
      const shortName = name.replace(' Office', '').toLowerCase();
      if (text.toLowerCase().includes(shortName)) {
        offices.push(name);
      }
    }
    return offices.length > 0 ? offices : ['Unknown'];
  }
}
