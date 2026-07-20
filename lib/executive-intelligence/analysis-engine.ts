import {
  ExecutiveSnapshot,
  ExecutiveDelta,
  RankedPriority,
  RiskIntelligence,
  StructuredRecommendation,
  RecommendationCategory,
  Likelihood,
  OrgImpact,
  RiskTrend,
  ScoringConfig,
  DEFAULT_SCORING_CONFIG,
  ScoreComponents,
  PendingDecision,
  CrossOfficeDependency,
  EscalatedRisk,
  OfficeStatus,
  OfficeHealth,
} from './types';

const OFFICE_OWNERS: Record<string, string> = {
  'Executive Office': 'CEO',
  'Research Office': 'Director of Research',
  'Product Office': 'Director of Product',
  'Operations Office': 'Director of Operations',
  'Knowledge Office': 'Director of Knowledge',
};

export class ExecutiveAnalysisEngine {
  constructor(private readonly scoringConfig: ScoringConfig = DEFAULT_SCORING_CONFIG) {}

  enrichRisks(snapshot: ExecutiveSnapshot, previousSnapshot?: ExecutiveSnapshot): RiskIntelligence[] {
    return snapshot.escalatedRisks.map((risk, i) => {
      const likelihood = this.deriveLikelihood(risk);
      const orgImpact = this.deriveOrgImpact(risk, snapshot);
      const trend = this.deriveRiskTrend(risk, snapshot, previousSnapshot);
      const recommendedOwner = OFFICE_OWNERS[risk.office] || 'Unassigned';
      const recommendedAction = this.deriveRiskAction(risk, likelihood, orgImpact);

      const rationale: string[] = [
        `Severity: ${risk.severity}`,
        `Likelihood: ${likelihood}`,
        `Impact: ${orgImpact}`,
        `Trend: ${trend}`,
        `Owner: ${recommendedOwner}`,
      ];

      return {
        id: `ri-${i + 1}`,
        source: risk,
        likelihood,
        organizationalImpact: orgImpact,
        trend,
        recommendedOwner,
        recommendedAction,
        confidence: likelihood === 'very_high' ? 0.95 : likelihood === 'high' ? 0.85 : 0.7,
        rationale,
      };
    });
  }

  private deriveLikelihood(risk: EscalatedRisk): Likelihood {
    const likelihoodMap: Record<string, Likelihood> = {
      critical: 'very_high',
      high: 'high',
      medium: 'medium',
      low: 'low',
    };
    return likelihoodMap[risk.severity] || 'medium';
  }

  private deriveOrgImpact(risk: EscalatedRisk, snapshot: ExecutiveSnapshot): OrgImpact {
    const affected = this.findAffectedOffices(risk.description, snapshot)
      .filter(o => o !== risk.office && o !== 'Unknown');
    if (affected.length >= 3) return 'enterprise';
    if (affected.length >= 2) return 'cross_office';
    if (affected.length === 1) return 'cross_office';
    return 'office';
  }

  private deriveRiskTrend(risk: EscalatedRisk, snapshot: ExecutiveSnapshot, previous?: ExecutiveSnapshot): RiskTrend {
    if (!previous) return 'stable';
    const prevRisk = previous.escalatedRisks.find(r => r.id === risk.id);
    if (!prevRisk) return 'worsening';
    return 'stable';
  }

  private deriveRiskAction(risk: EscalatedRisk, likelihood: Likelihood, impact: OrgImpact): string {
    if (likelihood === 'very_high' || impact === 'enterprise') {
      return 'Escalate immediately to executive leadership';
    }
    if (likelihood === 'high' || impact === 'cross_office') {
      return 'Schedule cross-office resolution within 24 hours';
    }
    return 'Assign to office lead for resolution';
  }

  computeDelta(previous: ExecutiveSnapshot, current: ExecutiveSnapshot): ExecutiveDelta {
    const newRisks = current.escalatedRisks.filter(
      cr => !previous.escalatedRisks.find(pr => pr.id === cr.id)
    );
    const resolvedRisks = previous.escalatedRisks
      .filter(pr => !current.escalatedRisks.find(cr => cr.id === pr.id))
      .map(r => r.id);

    const newBlockers: { office: string; blocker: string }[] = [];
    const resolvedBlockers: { office: string; blocker: string }[] = [];

    for (const [office, curStatus] of Object.entries(current.offices)) {
      const prevStatus = previous.offices[office];
      if (prevStatus) {
        for (const blocker of curStatus.blockers) {
          if (!prevStatus.blockers.includes(blocker)) {
            newBlockers.push({ office, blocker });
          }
        }
        for (const blocker of prevStatus.blockers) {
          if (!curStatus.blockers.includes(blocker)) {
            resolvedBlockers.push({ office, blocker });
          }
        }
      } else {
        for (const blocker of curStatus.blockers) {
          newBlockers.push({ office, blocker });
        }
      }
    }

    const newPendingDecisions = current.pendingDecisions.filter(
      cd => !previous.pendingDecisions.find(pd => pd.id === cd.id)
    );
    const resolvedPendingDecisions = previous.pendingDecisions
      .filter(pd => !current.pendingDecisions.find(cd => cd.id === pd.id))
      .map(d => d.id);

    const officeHealthChanges: ExecutiveDelta['officeHealthChanges'] = [];
    const allOffices = new Set([...Object.keys(previous.offices), ...Object.keys(current.offices)]);
    for (const office of allOffices) {
      const prevHealth = previous.offices[office]?.health;
      const curHealth = current.offices[office]?.health;
      if (prevHealth && curHealth && prevHealth !== curHealth) {
        officeHealthChanges.push({ office, previous: prevHealth, current: curHealth });
      }
    }

    const newDependencies = current.crossOfficeDependencies.filter(
      cd => !previous.crossOfficeDependencies.find(pd => pd.id === cd.id)
    );
    const resolvedDependencies = previous.crossOfficeDependencies
      .filter(pd => !current.crossOfficeDependencies.find(cd => cd.id === pd.id))
      .map(d => d.id);

    const parts: string[] = [];
    if (newRisks.length > 0) parts.push(`${newRisks.length} new risk(s)`);
    if (resolvedRisks.length > 0) parts.push(`${resolvedRisks.length} resolved risk(s)`);
    if (newBlockers.length > 0) parts.push(`${newBlockers.length} new blocker(s)`);
    if (resolvedBlockers.length > 0) parts.push(`${resolvedBlockers.length} resolved blocker(s)`);
    if (newPendingDecisions.length > 0) parts.push(`${newPendingDecisions.length} new pending decision(s)`);
    if (resolvedPendingDecisions.length > 0) parts.push(`${resolvedPendingDecisions.length} resolved decision(s)`);
    if (officeHealthChanges.length > 0) parts.push(`${officeHealthChanges.length} office health change(s)`);
    if (newDependencies.length > 0) parts.push(`${newDependencies.length} new dependency(ies)`);
    if (resolvedDependencies.length > 0) parts.push(`${resolvedDependencies.length} resolved dependenc(ies)`);
    const summary = parts.length > 0 ? parts.join('; ') : 'No material changes detected';

    return {
      previousSnapshotId: previous.snapshotId,
      previousTimestamp: previous.timestamp,
      currentSnapshotId: current.snapshotId,
      currentTimestamp: current.timestamp,
      newRisks,
      resolvedRisks,
      newBlockers,
      resolvedBlockers,
      newPendingDecisions,
      resolvedPendingDecisions,
      officeHealthChanges,
      newDependencies,
      resolvedDependencies,
      summary,
    };
  }

  generateRecommendations(snapshot: ExecutiveSnapshot, enrichedRisks: RiskIntelligence[]): StructuredRecommendation[] {
    const recs: Array<{
      priority: 'low' | 'medium' | 'high' | 'critical';
      category: RecommendationCategory;
      action: string;
      reason: string;
      expectedBenefit: string;
      suggestedOwner: string;
      supportingEvidence: string[];
      confidence: number;
      score: number;
    }> = [];

    // Recommendations from enriched risks
    for (const ri of enrichedRisks) {
      if (ri.likelihood === 'very_high' || ri.likelihood === 'high') {
        recs.push({
          priority: ri.source.severity === 'critical' ? 'critical' : 'high',
          category: 'address_risk',
          action: ri.recommendedAction,
          reason: ri.source.description,
          expectedBenefit: `Mitigate ${ri.organizationalImpact} impact in ${ri.source.office}`,
          suggestedOwner: ri.recommendedOwner,
          supportingEvidence: ri.rationale,
          confidence: ri.confidence,
          score: this.scoreRecommendation(ri.likelihood, ri.organizationalImpact),
        });
      }
    }

    // Recommendations from blocked cross-office dependencies
    for (const dep of snapshot.crossOfficeDependencies) {
      if (dep.status === 'blocked') {
        recs.push({
          priority: 'high',
          category: 'clear_dependency',
          action: `Resolve dependency: ${dep.sourceOffice} → ${dep.targetOffice}`,
          reason: dep.description,
          expectedBenefit: `Unblock workflow between ${dep.sourceOffice} and ${dep.targetOffice}`,
          suggestedOwner: OFFICE_OWNERS[dep.sourceOffice] || 'Unassigned',
          supportingEvidence: [
            `Source: ${dep.sourceOffice}`,
            `Target: ${dep.targetOffice}`,
            `Status: ${dep.status}`,
          ],
          confidence: 0.8,
          score: 0.7,
        });
      }
    }

    // Recommendations from stale pending decisions (>24h old)
    const now = snapshot.timestamp;
    for (const decision of snapshot.pendingDecisions) {
      if (decision.status === 'pending') {
        const hoursOpen = (now - decision.requestedAt) / 3600000;
        if (hoursOpen > 24) {
          recs.push({
            priority: decision.urgency === 'critical' ? 'critical' : 'high',
            category: 'review_decision',
            action: `Review ${decision.actionType} in ${decision.office}`,
            reason: `Pending for ${Math.round(hoursOpen)}h — requested by ${decision.requiredApprover}`,
            expectedBenefit: `Unblock governance workflow in ${decision.office}`,
            suggestedOwner: decision.requiredApprover,
            supportingEvidence: [
              `Status: ${decision.status}`,
              `Urgency: ${decision.urgency}`,
              `Rationale: ${decision.rationale}`,
            ],
            confidence: 0.75,
            score: Math.min(0.4 + (hoursOpen / 72) * 0.6, 1.0),
          });
        }
      }
    }

    // Recommendations from blockers
    for (const [office, status] of Object.entries(snapshot.offices)) {
      for (const blocker of status.blockers) {
        const isCritical = blocker.includes('critical') || blocker.includes('Production');
        recs.push({
          priority: isCritical ? 'critical' : 'high',
          category: 'resolve_blocker',
          action: `Resolve blocker in ${office}`,
          reason: blocker,
          expectedBenefit: `Restore normal operations in ${office}`,
          suggestedOwner: OFFICE_OWNERS[office] || 'Unassigned',
          supportingEvidence: [
            `Office: ${office}`,
            `Severity: ${isCritical ? 'critical' : 'high'}`,
          ],
          confidence: isCritical ? 0.9 : 0.8,
          score: isCritical ? 0.9 : 0.6,
        });
      }
    }

    // Deduplicate: same action + same owner = duplicate
    const seen = new Set<string>();
    const deduped = recs.filter(r => {
      const key = `${r.action}|${r.suggestedOwner}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    deduped.sort((a, b) => b.score - a.score);

    return deduped.map((item, index) => ({
      id: `rec-${index + 1}`,
      rank: index + 1,
      priority: item.priority,
      category: item.category,
      action: item.action,
      reason: item.reason,
      expectedBenefit: item.expectedBenefit,
      suggestedOwner: item.suggestedOwner,
      supportingEvidence: item.supportingEvidence,
      confidence: Math.round(item.confidence * 100) / 100,
      score: Math.round(item.score * 100) / 100,
    }));
  }

  private scoreRecommendation(likelihood: string, impact: string): number {
    const likelihoodScore: Record<string, number> = { low: 0.2, medium: 0.4, high: 0.7, very_high: 1.0 };
    const impactScore: Record<string, number> = { contained: 0.2, office: 0.4, cross_office: 0.7, enterprise: 1.0 };
    return ((likelihoodScore[likelihood] ?? 0.5) * 0.5) + ((impactScore[impact] ?? 0.5) * 0.5);
  }

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
    const lowerText = text.toLowerCase();
    for (const name of officeNames) {
      const shortName = name.replace(' Office', '').toLowerCase();
      const regex = new RegExp(`\\b${shortName}\\b`, 'i');
      if (regex.test(text)) {
        offices.push(name);
      }
    }
    return offices.length > 0 ? offices : ['Unknown'];
  }
}
