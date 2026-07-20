import { LearningArtifact, LearningArtifactType, ArtifactStatus, ValidationStatus, ValidationAlert, InsightRecommendation, LearningBriefingSection } from './learning-types';

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
    let patternIdx = 0;
    for (const [, group] of groups) {
      if (group.length < 2) continue;
      const combinedProducts = new Set<string>();
      const allEvidence: string[] = [];
      for (const l of group) {
        for (const p of l.productCoverage) combinedProducts.add(p);
        allEvidence.push(...l.evidenceIds);
      }
      const avgConfidence = group.reduce((s, l) => s + l.confidence, 0) / group.length;
      patternIdx++;
      const now = Date.now();
      patterns.push({
        id: `pattern-${now}-${patternIdx}`,
        type: 'pattern',
        title: `Pattern: ${group.map(l => l.title).join('; ')}`,
        description: `Multiple lessons: ${group.map(l => l.description).join(' | ')}`,
        status: 'candidate',
        version: 1,
        evidenceIds: allEvidence,
        confidence: Math.round(avgConfidence * 100) / 100,
        productCoverage: Array.from(combinedProducts),
        initiativeCoverage: [],
        createdAt: now,
        lastValidated: now,
        rationale: `Consolidated from ${group.length} related lessons`,
        validationStatus: 'current',
        validationHistory: [],
        validationConfidence: Math.round(avgConfidence * 100) / 100,
      });
    }
    return patterns;
  }

  promote(id: string, targetType: LearningArtifact['type'], approver: string, rationale: string): LearningArtifact | null { return null; }

  validate(artifactId: string, reviewer: string, newStatus: ValidationStatus, rationale: string): void {}

  getValidationAlerts(): ValidationAlert[] { return []; }

  buildLearningBriefing(): LearningBriefingSection {
    return { newLessons: [], emergingPatterns: [], promotionCandidates: [], recentlyApprovedStandards: [], governanceRefinements: [], validationAlerts: [], supersededStandards: [], executiveRecommendations: [] };
  }
}
