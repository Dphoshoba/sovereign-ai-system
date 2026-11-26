import { LearningArtifact, LearningArtifactType, ArtifactStatus, ValidationStatus, ValidationAlert, ValidationRecord, InsightRecommendation, LearningBriefingSection } from './learning-types';

export class OrganizationalLearningEngine {
  private artifacts: Map<string, LearningArtifact[]> = new Map();

  registerLesson(artifact: LearningArtifact): void {
    const id = artifact.id;
    if (!this.artifacts.has(id)) this.artifacts.set(id, []);
    const existing = this.artifacts.get(id)!;
    if (!existing.find(v => v.version === artifact.version)) existing.push(artifact);
  }

  registerLessons(artifacts: LearningArtifact[]): void {
    for (const a of artifacts) this.registerLesson(a);
  }

  getAllArtifacts(): LearningArtifact[] {
    const result: LearningArtifact[] = [];
    for (const versions of this.artifacts.values()) result.push(...versions);
    return result;
  }

  getArtifact(id: string, version?: number): LearningArtifact | undefined {
    const versions = this.artifacts.get(id);
    if (!versions) return undefined;
    if (version !== undefined) return versions.find(v => v.version === version);
    return versions.reduce((latest, v) => v.version > latest.version ? v : latest, versions[0]);
  }

  getArtifactHistory(id: string): LearningArtifact[] {
    const versions = this.artifacts.get(id);
    return versions ? [...versions].sort((a, b) => a.version - b.version) : [];
  }

  detectPatterns(): LearningArtifact[] {
    const allLessons = this.getAllArtifacts().filter(a => a.type === 'lesson' && a.status === 'draft');
    const groups = new Map<string, LearningArtifact[]>();

    for (const lesson of allLessons) {
      const key = [...lesson.productCoverage].sort().join('|');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(lesson);
    }

    const patterns: LearningArtifact[] = [];
    for (const [key, group] of groups) {
      const unique = new Map<string, LearningArtifact>();
      for (const l of group) unique.set(l.id, l);
      const deduped = Array.from(unique.values());
      if (deduped.length < 2) continue;
      const combinedProducts = new Set<string>();
      const allEvidence: string[] = [];
      for (const l of deduped) {
        for (const p of l.productCoverage) combinedProducts.add(p);
        allEvidence.push(...l.evidenceIds);
      }
      const avgConfidence = deduped.reduce((s, l) => s + l.confidence, 0) / deduped.length;
      const lessonIds = deduped.map(l => l.id).sort().join('+');
      const pattern: LearningArtifact = {
        id: `pattern-${key}-${lessonIds}`,
        type: 'pattern',
        title: `Pattern: ${deduped.map(l => l.title).join('; ')}`,
        description: `Multiple lessons: ${deduped.map(l => l.description).join(' | ')}`,
        status: 'candidate',
        version: 1,
        evidenceIds: allEvidence,
        confidence: Math.round(avgConfidence * 100) / 100,
        productCoverage: Array.from(combinedProducts),
        initiativeCoverage: [],
        createdAt: Date.now(),
        lastValidated: Date.now(),
        rationale: `Consolidated from ${deduped.length} related lessons`,
        validationStatus: 'current',
        validationHistory: [],
        validationConfidence: Math.round(avgConfidence * 100) / 100,
      };
      this.registerLesson(pattern);
      patterns.push(pattern);
    }
    return patterns;
  }

  promote(id: string, targetType: LearningArtifact['type'], approver: string, rationale: string): LearningArtifact | null {
    if (!approver) return null;
    const source = this.getArtifact(id);
    if (!source) return null;
    if (source.evidenceIds.length === 0) return null;

    const allowedTargets: LearningArtifact['type'][] = ['playbook', 'workflow_template', 'governance_pattern', 'best_practice'];
    if (!allowedTargets.includes(targetType)) return null;

    const promoted: LearningArtifact = {
      id: `${targetType}-${id}`,
      type: targetType,
      title: source.title,
      description: source.description,
      status: 'approved',
      version: 1,
      evidenceIds: [...source.evidenceIds],
      confidence: source.confidence,
      productCoverage: [...source.productCoverage],
      initiativeCoverage: [...source.initiativeCoverage],
      createdAt: Date.now(),
      lastValidated: Date.now(),
      approvedBy: approver,
      approvedAt: Date.now(),
      rationale,
      validationStatus: 'current',
      validationHistory: [],
      validationConfidence: source.validationConfidence,
    };
    this.registerLesson(promoted);

    const updatedSource = { ...source, status: 'superseded' as const, supersededBy: promoted.id };
    this.registerLesson(updatedSource);

    return promoted;
  }

  validate(artifactId: string, reviewer: string, newStatus: ValidationStatus, rationale: string): void {
    const versions = this.artifacts.get(artifactId);
    if (!versions) return;
    const latestIdx = versions.reduce((best, v, i) => v.version > versions[best].version ? i : best, 0);
    const artifact = versions[latestIdx];

    const record: ValidationRecord = {
      timestamp: Date.now(),
      status: newStatus,
      reviewer,
      rationale,
    };

    versions[latestIdx] = {
      ...artifact,
      lastValidated: Date.now(),
      validationStatus: newStatus,
      validationHistory: [...artifact.validationHistory, record],
      validationConfidence: newStatus === 'current'
        ? Math.min(1, artifact.validationConfidence + 0.05)
        : newStatus === 'declining'
          ? Math.max(0, artifact.validationConfidence - 0.2)
          : artifact.validationConfidence,
    };
  }

  getValidationAlerts(): ValidationAlert[] {
    const alerts: ValidationAlert[] = [];
    for (const versions of this.artifacts.values()) {
      const latest = versions.reduce((best, v) => v.version > best.version ? v : best);
      if (latest.validationStatus === 'needs_review') {
        alerts.push({
          artifactId: latest.id,
          artifactTitle: latest.title,
          alertType: 'needs_review',
          previousValidationStatus: 'current',
          currentValidationStatus: 'needs_review',
          lastValidated: latest.lastValidated,
          rationale: `Artifact ${latest.id} requires validation review`,
        });
      }
      if (latest.validationStatus === 'declining') {
        alerts.push({
          artifactId: latest.id,
          artifactTitle: latest.title,
          alertType: 'confidence_declining',
          previousValidationStatus: 'current',
          currentValidationStatus: 'declining',
          lastValidated: latest.lastValidated,
          rationale: `Confidence declining for ${latest.id}`,
        });
      }
      if (latest.status === 'superseded') {
        alerts.push({
          artifactId: latest.id,
          artifactTitle: latest.title,
          alertType: 'superseded',
          previousValidationStatus: latest.validationStatus,
          currentValidationStatus: 'superseded',
          lastValidated: latest.lastValidated,
          rationale: `Superseded by ${latest.supersededBy || 'newer version'}`,
        });
      }
    }
    return alerts;
  }

  buildLearningBriefing(): LearningBriefingSection {
    const latest = this.getLatestArtifacts();
    return {
      newLessons: latest.filter(a => a.type === 'lesson' && a.status === 'draft'),
      emergingPatterns: latest.filter(a => a.type === 'pattern' && a.status === 'candidate'),
      promotionCandidates: latest.filter(a => a.status === 'candidate'),
      recentlyApprovedStandards: latest.filter(a => a.status === 'approved' && (a.type === 'playbook' || a.type === 'governance_pattern')),
      governanceRefinements: latest.filter(a => a.type === 'governance_pattern' && a.status === 'approved'),
      validationAlerts: this.getValidationAlerts(),
      supersededStandards: latest.filter(a => a.status === 'superseded'),
      executiveRecommendations: this.synthesizeRecommendations(),
    };
  }

  private getLatestArtifacts(): LearningArtifact[] {
    const result: LearningArtifact[] = [];
    for (const versions of this.artifacts.values()) {
      const latest = versions.reduce((best, v) => v.version > best.version ? v : best);
      result.push(latest);
    }
    return result;
  }

  private synthesizeRecommendations(): InsightRecommendation[] {
    const candidates = this.getLatestArtifacts().filter(a => a.type === 'pattern' && a.status === 'candidate');
    return candidates.map((p, i) => ({
      id: `rec-${p.id}-${i}`,
      insightId: p.id,
      recommendation: `Promote pattern "${p.title}" to a standard artifact`,
      rationale: `Pattern covers ${p.productCoverage.length} product(s) (${p.productCoverage.join(', ')}) with ${p.evidenceIds.length} evidence piece(s) and confidence ${p.confidence}`,
      evidenceIds: [...p.evidenceIds],
      confidence: p.confidence,
    }));
  }
}
