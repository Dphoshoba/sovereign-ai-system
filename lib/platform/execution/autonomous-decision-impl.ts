import {
  ActionCandidate,
  ApprovalLevel,
  AutonomousDecisionEngine,
  AutonomousDecisionError,
  DecisionAction,
  DecisionAuditRecord,
  OperationalDecision,
  RiskAssessment,
  RiskFactor,
  TriggeringState,
} from "./autonomous-decision";

// ── Severity weights for risk scoring ──

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 15,
  major: 10,
  minor: 5,
  info: 0,
};

// ── Action configuration per state ──

interface ActionConfig {
  primary: DecisionAction;
  alternatives: DecisionAction[];
}

const STATE_ACTIONS: Record<string, ActionConfig> = {
  failed: { primary: 'initiate_recovery', alternatives: ['request_human_approval', 'notify'] },
  degraded: { primary: 'monitor', alternatives: ['notify', 'no_action'] },
  recovering: { primary: 'monitor', alternatives: ['no_action', 'notify'] },
  healthy: { primary: 'no_action', alternatives: ['monitor'] },
  maintenance: { primary: 'no_action', alternatives: ['monitor'] },
  paused: { primary: 'no_action', alternatives: ['monitor'] },
};

let nextDecisionId = 1;

// ── Implementation ──

export class AutonomousDecisionEngineImpl implements AutonomousDecisionEngine {
  evaluate(state: TriggeringState): OperationalDecision {
    const config = STATE_ACTIONS[state.operationalState];
    if (!config) {
      throw new AutonomousDecisionError(`Unknown operational state: '${state.operationalState}'`);
    }

    // 7B.2 — Risk Scoring
    const risk = this.assessRisk(state);

    // 7B.3 — Candidate Action Evaluation
    const candidates = this.evaluateCandidates(config, risk, state);

    // Select best (highest confidence, lowest risk)
    const selected = this.selectBest(candidates);

    // 7B.4 — Decision Trace
    const id = `dec-${nextDecisionId++}`;
    const now = Date.now();
    const audit = this.buildAuditRecord(id, now, state, selected, candidates);

    return {
      id,
      timestamp: now,
      triggeringState: state,
      selectedAction: selected,
      alternatives: candidates.filter((c) => c !== selected),
      riskAssessment: risk,
      policyReferences: ['G-044'],
      auditRecord: audit,
    };
  }

  // ── Risk Scoring ──

  private assessRisk(state: TriggeringState): RiskAssessment {
    const factors: RiskFactor[] = [];

    // Health risk
    const healthScore = 100 - state.overallScore;
    const healthRisk = Math.round((healthScore / 100) * 40);
    if (healthRisk > 0) {
      factors.push({
        name: 'platform_health',
        score: healthRisk,
        severity: healthRisk > 25 ? 'high' : healthRisk > 10 ? 'medium' : 'low',
        description: `Platform health score ${state.overallScore}/100 contributes ${healthRisk} risk points`,
      });
    }

    // Impact risk
    let impactRisk = 0;
    for (const impact of state.activeImpacts) {
      impactRisk += SEVERITY_WEIGHT[impact.severity] ?? 0;
    }
    impactRisk = Math.min(impactRisk, 30);
    if (impactRisk > 0) {
      factors.push({
        name: 'dependency_impact',
        score: impactRisk,
        severity: impactRisk > 20 ? 'high' : impactRisk > 10 ? 'medium' : 'low',
        description: `${state.activeImpacts.length} active impacts contribute ${impactRisk} risk points`,
      });
    }

    // Degradation risk
    const unhealthyCount = state.layerHealth.filter((h) => h.status === 'unhealthy' || h.status === 'degraded').length;
    const degradationRisk = Math.min(unhealthyCount * 10, 30);
    if (degradationRisk > 0) {
      factors.push({
        name: 'layer_degradation',
        score: degradationRisk,
        severity: degradationRisk > 20 ? 'high' : degradationRisk > 10 ? 'medium' : 'low',
        description: `${unhealthyCount} degraded or unhealthy layers contribute ${degradationRisk} risk points`,
      });
    }

    const overallRisk = Math.min(
      factors.reduce((s, f) => s + f.score, 0),
      100,
    );

    return { overallRisk, factors };
  }

  // ── Candidate Evaluation ──

  private evaluateCandidates(
    config: ActionConfig,
    risk: RiskAssessment,
    state: TriggeringState,
  ): ActionCandidate[] {
    const allActions = [config.primary, ...config.alternatives];
    return allActions.map((action) => this.scoreCandidate(action, risk, state, config.primary));
  }

  private scoreCandidate(
    action: DecisionAction,
    risk: RiskAssessment,
    state: TriggeringState,
    primaryAction: DecisionAction,
  ): ActionCandidate {
    const isPrimary = action === primaryAction;
    const confidence = this.computeConfidence(action, state, isPrimary);
    const riskScore = this.computeActionRisk(action, risk);
    const requiredLevel = this.computeApprovalLevel(action, riskScore);
    const rejected = this.isRejected(action, state.operationalState, isPrimary);

    const rationale = rejected
      ? `Rejected: ${this.rejectionReason(action, primaryAction)}`
      : `Recommended: ${this.actionDescription(action, state)}`;

    return {
      action,
      confidence,
      rationale,
      riskScore,
      requiredApprovalLevel: requiredLevel,
      rejected,
      rejectionReason: rejected ? this.rejectionReason(action, primaryAction) : null,
    };
  }

  private computeConfidence(action: DecisionAction, state: TriggeringState, isPrimary: boolean): number {
    if (isPrimary) return round(0.85 + (state.overallScore / 100) * 0.1, 2);

    // Alternatives get lower confidence
    switch (action) {
      case 'no_action':
        return round(0.5 - (state.overallScore / 100) * 0.2, 2);
      case 'monitor':
        return round(0.6, 2);
      case 'notify':
        return round(0.7, 2);
      case 'request_human_approval':
        return round(0.4, 2);
      default:
        return 0.3;
    }
  }

  private computeActionRisk(action: DecisionAction, risk: RiskAssessment): number {
    switch (action) {
      case 'initiate_recovery':
        return Math.min(risk.overallRisk + 20, 100);
      case 'request_human_approval':
        return risk.overallRisk;
      case 'pause_workflows':
        return Math.min(risk.overallRisk + 10, 100);
      case 'notify':
        return Math.round(risk.overallRisk * 0.5);
      case 'monitor':
        return Math.round(risk.overallRisk * 0.3);
      case 'no_action':
        return Math.round(risk.overallRisk * 0.1);
    }
  }

  private computeApprovalLevel(action: DecisionAction, riskScore: number): ApprovalLevel {
    if (action === 'initiate_recovery' || riskScore > 70) return 'high';
    if (action === 'pause_workflows' || riskScore > 40) return 'medium';
    if (action === 'request_human_approval' || riskScore > 20) return 'low';
    return 'none';
  }

  private isRejected(action: DecisionAction, state: string, isPrimary: boolean): boolean {
    if (isPrimary) return false;
    // Reject no_action for failed state
    if (action === 'no_action' && state === 'failed') return true;
    // Reject initiate_recovery for healthy state
    if (action === 'initiate_recovery' && state === 'healthy') return true;
    return false;
  }

  private rejectionReason(action: DecisionAction, primaryAction: DecisionAction): string {
    return `'${action}' is less suitable than '${primaryAction}' for current state`;
  }

  private actionDescription(action: DecisionAction, state: TriggeringState): string {
    switch (action) {
      case 'initiate_recovery':
        return `Initiate recovery from ${state.operationalState} state (score: ${state.overallScore})`;
      case 'monitor':
        return `Monitor platform in ${state.operationalState} state (score: ${state.overallScore})`;
      case 'notify':
        return `Notify operators of ${state.operationalState} state with ${state.activeImpacts.length} active impacts`;
      case 'no_action':
        return `No action required — platform is ${state.operationalState}`;
      case 'request_human_approval':
        return `Request human approval for recovery from ${state.operationalState} state`;
      case 'pause_workflows':
        return `Pause workflows due to ${state.operationalState} state`;
    }
  }

  // ── Selection ──

  private selectBest(candidates: ActionCandidate[]): ActionCandidate {
    const active = candidates.filter((c) => !c.rejected);
    if (active.length === 0) {
      throw new AutonomousDecisionError('No viable action candidates');
    }
    return active.sort((a, b) => {
      // Higher confidence first, then lower risk
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return a.riskScore - b.riskScore;
    })[0];
  }

  // ── Audit Record ──

  private buildAuditRecord(
    decisionId: string,
    timestamp: number,
    state: TriggeringState,
    selected: ActionCandidate,
    candidates: ActionCandidate[],
  ): DecisionAuditRecord {
    return {
      decisionId,
      timestamp,
      inputs: {
        operationalState: state.operationalState,
        activeImpacts: state.activeImpacts.length,
        layerHealthCount: state.layerHealth.length,
      },
      evaluatedRules: ['state_transition_rules', 'risk_scoring', 'candidate_evaluation'],
      selectedAction: selected.action,
      rejectedAlternatives: candidates.filter((c) => c !== selected).map((c) => c.action),
      confidence: selected.confidence,
      policyReferences: ['G-044'],
    };
  }
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
