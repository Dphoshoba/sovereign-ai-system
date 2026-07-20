import { describe, it, expect } from 'vitest';
import { OrganizationalLearningEngine } from '../../lib/executive-intelligence/learning-engine';
import type { LearningArtifact, LearningArtifactType } from '../../lib/executive-intelligence/learning-types';

function makeArtifact(overrides: Partial<LearningArtifact> & { id: string; type: LearningArtifactType; title: string; version: number }): LearningArtifact {
  return {
    id: overrides.id,
    type: overrides.type,
    title: overrides.title,
    description: overrides.description ?? '',
    status: overrides.status ?? 'candidate',
    version: overrides.version,
    evidenceIds: overrides.evidenceIds ?? [],
    confidence: overrides.confidence ?? 0.5,
    productCoverage: overrides.productCoverage ?? [],
    initiativeCoverage: overrides.initiativeCoverage ?? [],
    createdAt: overrides.createdAt ?? Date.now(),
    lastValidated: overrides.lastValidated ?? Date.now(),
    rationale: overrides.rationale ?? '',
    validationStatus: overrides.validationStatus ?? 'current',
    validationHistory: overrides.validationHistory ?? [],
    validationConfidence: overrides.validationConfidence ?? 0.5,
    supersedes: overrides.supersedes,
    supersededBy: overrides.supersededBy,
    approvedBy: overrides.approvedBy,
    approvedAt: overrides.approvedAt,
  };
}

const LESSON_1: LearningArtifact = makeArtifact({
  id: 'lesson-001', type: 'lesson', title: 'Test Lesson 1', version: 1,
  evidenceIds: ['ev-mw-001', 'ev-bq-001'],
  productCoverage: ['menwise360', 'bible-quest'],
  confidence: 0.75,
  validationStatus: 'current',
});

const LESSON_2: LearningArtifact = makeArtifact({
  id: 'lesson-002', type: 'lesson', title: 'Test Lesson 2', version: 1,
  evidenceIds: ['ev-ca-001', 'ev-iv-001'],
  productCoverage: ['creator-automation', 'inspirevoice'],
  confidence: 0.8,
});

const LESSON_3: LearningArtifact = makeArtifact({
  id: 'lesson-003', type: 'lesson', title: 'Test Lesson 3', version: 1,
  evidenceIds: ['ev-res-001'],
  productCoverage: ['menwise360', 'bible-quest', 'inspirevoice'],
  confidence: 0.7,
});

const ALL_TYPES: LearningArtifactType[] = [
  'lesson', 'pattern', 'playbook', 'workflow_template',
  'governance_pattern', 'best_practice', 'executive_insight',
];

describe('Era 5 Phase 5 — Organizational Learning', () => {

  it('accepts all 7 artifact types', () => {
    const engine = new OrganizationalLearningEngine();
    const artifacts = ALL_TYPES.map((t, i) => makeArtifact({
      id: `artifact-${i + 1}`, type: t, title: `${t} Artifact`, version: 1,
    }));
    engine.registerLessons(artifacts);
    expect(engine.getAllArtifacts()).toHaveLength(7);
  });

  it('registering same id twice creates new version (immutable)', () => {
    const engine = new OrganizationalLearningEngine();
    engine.registerLesson(makeArtifact({
      id: 'multi-001', type: 'lesson', title: 'Original Title', version: 1,
    }));
    engine.registerLesson(makeArtifact({
      id: 'multi-001', type: 'lesson', title: 'Updated Title', version: 2,
    }));
    const all = engine.getAllArtifacts();
    expect(all).toHaveLength(2);
    expect(engine.getArtifact('multi-001', 1)?.title).toBe('Original Title');
    expect(engine.getArtifact('multi-001', 2)?.title).toBe('Updated Title');
  });

  it('getArtifact returns latest version when version not specified', () => {
    const engine = new OrganizationalLearningEngine();
    engine.registerLesson(makeArtifact({
      id: 'latest-001', type: 'lesson', title: 'Version 1', version: 1,
    }));
    engine.registerLesson(makeArtifact({
      id: 'latest-001', type: 'lesson', title: 'Version 2', version: 2,
    }));
    expect(engine.getArtifact('latest-001')?.version).toBe(2);
    expect(engine.getArtifact('latest-001')?.title).toBe('Version 2');
  });

  it('registering a lesson with evidence lineage preserves references', () => {
    const engine = new OrganizationalLearningEngine();
    engine.registerLesson(LESSON_1);
    const retrieved = engine.getArtifact('lesson-001', 1);
    expect(retrieved?.evidenceIds).toEqual(['ev-mw-001', 'ev-bq-001']);
  });

  it('repeated observations across products produce a candidate pattern', () => {
    const engine = new OrganizationalLearningEngine();
    const lessonA = makeArtifact({
      id: 'pd-lesson-a', type: 'lesson', title: 'Lesson A', version: 1,
      evidenceIds: ['ev-a1', 'ev-a2'],
      productCoverage: ['menwise360', 'bible-quest'],
      status: 'draft',
      confidence: 0.8,
    });
    const lessonB = makeArtifact({
      id: 'pd-lesson-b', type: 'lesson', title: 'Lesson B', version: 1,
      evidenceIds: ['ev-b1'],
      productCoverage: ['menwise360', 'bible-quest'],
      status: 'draft',
      confidence: 0.7,
    });
    engine.registerLessons([lessonA, lessonB]);
    const patterns = engine.detectPatterns();
    expect(patterns.length).toBeGreaterThanOrEqual(1);
    const pattern = patterns[0];
    expect(pattern.type).toBe('pattern');
    expect(pattern.status).toBe('candidate');
    expect(pattern.productCoverage).toContain('menwise360');
    expect(pattern.productCoverage).toContain('bible-quest');
  });

  it('single observation does not form a pattern', () => {
    const engine = new OrganizationalLearningEngine();
    engine.registerLesson(makeArtifact({
      id: 'pd-solo', type: 'lesson', title: 'Solo Lesson', version: 1,
      evidenceIds: ['ev-solo'],
      productCoverage: ['menwise360'],
      status: 'draft',
      confidence: 0.6,
    }));
    const patterns = engine.detectPatterns();
    const soloPatterns = patterns.filter(p => p.evidenceIds.includes('ev-solo'));
    expect(soloPatterns).toHaveLength(0);
  });

  it('pattern detection is deterministic', () => {
    const engine = new OrganizationalLearningEngine();
    const lessons = [
      makeArtifact({
        id: 'pd-det-a', type: 'lesson', title: 'Det A', version: 1,
        evidenceIds: ['ev-da1'],
        productCoverage: ['menwise360', 'bible-quest'],
        status: 'draft',
        confidence: 0.7,
      }),
      makeArtifact({
        id: 'pd-det-b', type: 'lesson', title: 'Det B', version: 1,
        evidenceIds: ['ev-db1'],
        productCoverage: ['menwise360', 'bible-quest'],
        status: 'draft',
        confidence: 0.8,
      }),
      makeArtifact({
        id: 'pd-det-c', type: 'lesson', title: 'Det C', version: 1,
        evidenceIds: ['ev-dc1'],
        productCoverage: ['creator-automation'],
        status: 'draft',
        confidence: 0.9,
      }),
    ];
    engine.registerLessons(lessons);
    const first = engine.detectPatterns();
    const second = engine.detectPatterns();
    expect(first.length).toBe(second.length);
    for (let i = 0; i < first.length; i++) {
      expect(first[i].id).toBe(second[i].id);
      expect(first[i].evidenceIds).toEqual(second[i].evidenceIds);
      expect(first[i].productCoverage).toEqual(second[i].productCoverage);
      expect(first[i].confidence).toBe(second[i].confidence);
    }
  });

  it('pattern references evidence from all contributing lessons', () => {
    const engine = new OrganizationalLearningEngine();
    const lessonX = makeArtifact({
      id: 'pd-ev-x', type: 'lesson', title: 'Evidence X', version: 1,
      evidenceIds: ['ev-x-001', 'ev-x-002'],
      productCoverage: ['menwise360', 'bible-quest'],
      status: 'draft',
      confidence: 0.75,
    });
    const lessonY = makeArtifact({
      id: 'pd-ev-y', type: 'lesson', title: 'Evidence Y', version: 1,
      evidenceIds: ['ev-y-001'],
      productCoverage: ['menwise360', 'bible-quest'],
      status: 'draft',
      confidence: 0.85,
    });
    engine.registerLessons([lessonX, lessonY]);
    const patterns = engine.detectPatterns();
    const pattern = patterns.find(p => p.evidenceIds.includes('ev-x-001'));
    expect(pattern).toBeDefined();
    expect(pattern!.evidenceIds).toContain('ev-x-001');
    expect(pattern!.evidenceIds).toContain('ev-x-002');
    expect(pattern!.evidenceIds).toContain('ev-y-001');
  });

  it('supersedes chain is queryable', () => {
    const engine = new OrganizationalLearningEngine();
    engine.registerLesson(makeArtifact({
      id: 'chain-001', type: 'lesson', title: 'Chain v1', version: 1,
    }));
    engine.registerLesson(makeArtifact({
      id: 'chain-001', type: 'lesson', title: 'Chain v2', version: 2,
      supersedes: 'chain-001-v1',
    }));
    engine.registerLesson(makeArtifact({
      id: 'chain-001', type: 'lesson', title: 'Chain v3', version: 3,
      supersedes: 'chain-001-v2', supersededBy: '',
    }));
    const history = engine.getArtifactHistory('chain-001');
    expect(history).toHaveLength(3);
    expect(history[0].version).toBe(1);
    expect(history[0].supersedes).toBeUndefined();
    expect(history[1].version).toBe(2);
    expect(history[1].supersedes).toBe('chain-001-v1');
    expect(history[2].version).toBe(3);
    expect(history[2].supersedes).toBe('chain-001-v2');
  });

  it('pattern promotes to playbook with approval', () => {
    const engine = new OrganizationalLearningEngine();
    const lessonA = makeArtifact({
      id: 'promo-a', type: 'lesson', title: 'Promo A', version: 1,
      evidenceIds: ['ev-pa-001', 'ev-pa-002'],
      productCoverage: ['menwise360', 'bible-quest'],
      status: 'draft',
      confidence: 0.8,
    });
    const lessonB = makeArtifact({
      id: 'promo-b', type: 'lesson', title: 'Promo B', version: 1,
      evidenceIds: ['ev-pb-001'],
      productCoverage: ['menwise360', 'bible-quest'],
      status: 'draft',
      confidence: 0.75,
    });
    engine.registerLessons([lessonA, lessonB]);
    const patterns = engine.detectPatterns();
    expect(patterns.length).toBeGreaterThanOrEqual(1);
    const pattern = patterns[0];
    const result = engine.promote(pattern.id, 'playbook', 'exec-director', 'Approved for enterprise use');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('playbook');
    expect(result!.status).toBe('approved');
    expect(result!.approvedBy).toBe('exec-director');
    expect(result!.evidenceIds.length).toBeGreaterThanOrEqual(1);
  });

  it('pattern promotes to governance_pattern with approval', () => {
    const engine = new OrganizationalLearningEngine();
    const lessonA = makeArtifact({
      id: 'promo-gov-a', type: 'lesson', title: 'Gov A', version: 1,
      evidenceIds: ['ev-ga-001'],
      productCoverage: ['menwise360', 'bible-quest'],
      status: 'draft',
      confidence: 0.7,
    });
    const lessonB = makeArtifact({
      id: 'promo-gov-b', type: 'lesson', title: 'Gov B', version: 1,
      evidenceIds: ['ev-gb-001'],
      productCoverage: ['menwise360', 'bible-quest'],
      status: 'draft',
      confidence: 0.85,
    });
    engine.registerLessons([lessonA, lessonB]);
    const patterns = engine.detectPatterns();
    expect(patterns.length).toBeGreaterThanOrEqual(1);
    const pattern = patterns[0];
    const result = engine.promote(pattern.id, 'governance_pattern', 'exec-director', 'Governance approval');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('governance_pattern');
    expect(result!.status).toBe('approved');
  });

  it('promotion without evidence is rejected', () => {
    const engine = new OrganizationalLearningEngine();
    engine.registerLesson(makeArtifact({
      id: 'no-evidence', type: 'lesson', title: 'No Evidence', version: 1,
      evidenceIds: [],
    }));
    const result = engine.promote('no-evidence', 'playbook', 'exec', 'No evidence');
    expect(result).toBeNull();
  });

  it('promotion without approver is rejected', () => {
    const engine = new OrganizationalLearningEngine();
    engine.registerLesson(makeArtifact({
      id: 'no-approver', type: 'lesson', title: 'No Approver', version: 1,
      evidenceIds: ['ev-na-001'],
    }));
    const result = engine.promote('no-approver', 'playbook', '', 'No approver');
    expect(result).toBeNull();
  });

  it('promotion to non-standard type is rejected', () => {
    const engine = new OrganizationalLearningEngine();
    engine.registerLesson(makeArtifact({
      id: 'bad-type', type: 'lesson', title: 'Bad Type', version: 1,
      evidenceIds: ['ev-bt-001'],
    }));
    const result = engine.promote('bad-type', 'lesson' as any, 'exec', 'Trying lesson type');
    expect(result).toBeNull();
  });

  it('artifacts start with current validation status', () => {
    const engine = new OrganizationalLearningEngine();
    engine.registerLesson(makeArtifact({
      id: 'val-start', type: 'lesson', title: 'Validation Start', version: 1,
      validationStatus: 'current',
    }));
    const retrieved = engine.getArtifact('val-start');
    expect(retrieved?.validationStatus).toBe('current');
  });

  it('validate updates validation status and records history', () => {
    const engine = new OrganizationalLearningEngine();
    engine.registerLesson(makeArtifact({
      id: 'val-update', type: 'lesson', title: 'Validation Update', version: 1,
    }));
    engine.validate('val-update', 'quality-reviewer', 'needs_review', 'Evidence is 6 months old');
    const retrieved = engine.getArtifact('val-update');
    expect(retrieved?.validationStatus).toBe('needs_review');
    expect(retrieved?.validationHistory.length).toBe(1);
    expect(retrieved?.validationHistory[0].reviewer).toBe('quality-reviewer');
    expect(retrieved?.validationHistory[0].status).toBe('needs_review');
  });

  it('declining confidence produces validation alert', () => {
    const engine = new OrganizationalLearningEngine();
    engine.registerLesson(makeArtifact({
      id: 'val-decline', type: 'lesson', title: 'Validation Decline', version: 1,
      validationStatus: 'current',
    }));
    engine.validate('val-decline', 'reviewer', 'declining', 'Newer evidence contradicts');
    const alerts = engine.getValidationAlerts();
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    const alert = alerts.find(a => a.artifactId === 'val-decline');
    expect(alert).toBeDefined();
    expect(alert!.alertType).toBe('confidence_declining');
  });

  it('multiple validations preserve full history', () => {
    const engine = new OrganizationalLearningEngine();
    engine.registerLesson(makeArtifact({
      id: 'val-multi', type: 'lesson', title: 'Validation Multi', version: 1,
    }));
    engine.validate('val-multi', 'reviewer-a', 'needs_review', 'First review');
    engine.validate('val-multi', 'reviewer-b', 'declining', 'Second review');
    engine.validate('val-multi', 'reviewer-c', 'current', 'Third review');
    const retrieved = engine.getArtifact('val-multi');
    expect(retrieved?.validationHistory.length).toBe(3);
  });
});
