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

});
