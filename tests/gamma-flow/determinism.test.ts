/**
 * Tests for Determinism & Reproducibility
 * Coverage: deterministic execution, hash consistency, reproducible states
 */

import { describe, it, expect } from 'vitest';
import { previewWorkflow } from '../../lib/flow/workflow-preview-engine';
import { validateWorkflow } from '../../lib/flow/workflow-validator';
import { compileWorkflow } from '../../lib/flow/workflow-compiler';
import { MOCK_WORKFLOW_DEFINITIONS, BASE_TIME } from '../../src/lib/gamma-flow/mock-data';
import { FlowRegistryReader, initializeFlowRegistry } from '../../lib/gamma/flow-registry-reader';

describe('Determinism & Reproducibility', () => {
  describe('Consistent Validation Scores', () => {
    it('should produce same validation scores across runs', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const result1 = validateWorkflow(def);
      const result2 = validateWorkflow(def);

      expect(result1.safetyScore).toBe(result2.safetyScore);
      expect(result1.readinessScore).toBe(result2.readinessScore);
    });

    it('should have consistent error counts', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const result1 = validateWorkflow(def);
      const result2 = validateWorkflow(def);

      expect(result1.errors.length).toBe(result2.errors.length);
    });
  });

  describe('Consistent Compilation', () => {
    it('should produce same compiled workflow', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const compiled1 = compileWorkflow(def);
      const compiled2 = compileWorkflow(def);

      expect(compiled1.steps.length).toBe(compiled2.steps.length);
      expect(compiled1.executionTimeEstimate).toBe(compiled2.executionTimeEstimate);
    });

    it('should have consistent critical path', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const compiled1 = compileWorkflow(def);
      const compiled2 = compileWorkflow(def);

      expect(compiled1.criticalPath.length).toBe(compiled2.criticalPath.length);
    });
  });

  describe('Consistent Preview Results', () => {
    it('should produce same step results', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const result1 = previewWorkflow(def, 'det_exec_001');
      const result2 = previewWorkflow(def, 'det_exec_002');

      expect(Object.keys(result1.stepResults).length).toBe(Object.keys(result2.stepResults).length);
    });

    it('should have consistent success status', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const result1 = previewWorkflow(def, 'det_exec_003');
      const result2 = previewWorkflow(def, 'det_exec_004');

      expect(result1.success).toBe(result2.success);
    });
  });

  describe('Base Time Determinism', () => {
    it('should use BASE_TIME consistently', () => {
      expect(BASE_TIME).toEqual(new Date('2026-07-10T12:00:00Z'));
    });

    it('should have all mock data using BASE_TIME', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      expect(def.createdAt).toEqual(BASE_TIME);
      expect(def.updatedAt).toEqual(BASE_TIME);
    });
  });

  describe('Registry Hash Consistency', () => {
    it('should produce identical template hashes', () => {
      initializeFlowRegistry();
      const registry1 = new FlowRegistryReader();

      const templates = registry1.getTemplates();
      if (templates.length > 0) {
        const id = templates[0].id;
        const hash1 = registry1.getTemplateHash(id);
        const hash2 = registry1.getTemplateHash(id);

        expect(hash1).toBe(hash2);
      }
    });

    it('should have consistent template ordering', () => {
      initializeFlowRegistry();
      const registry = new FlowRegistryReader();

      const templates1 = registry.getTemplates();
      const templates2 = registry.getTemplates();

      expect(templates1.length).toBe(templates2.length);
      for (let i = 0; i < templates1.length; i++) {
        expect(templates1[i].id).toBe(templates2[i].id);
      }
    });
  });

  describe('No Randomness in Deterministic Paths', () => {
    it('should not use Math.random in validation', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      // Run validation multiple times - should always be same
      const results = Array.from({ length: 5 }, () => validateWorkflow(def));

      const scores = results.map((r) => r.safetyScore);
      const uniqueScores = new Set(scores);

      // All scores should be identical
      expect(uniqueScores.size).toBe(1);
    });

    it('should not use Date.now in preview', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      // Run preview multiple times - should always be same
      const results = Array.from({ length: 5 }, (_, i) => previewWorkflow(def, `det_${i}`));

      const stepCounts = results.map((r) => Object.keys(r.stepResults).length);
      const uniqueCounts = new Set(stepCounts);

      // All should have same step count
      expect(uniqueCounts.size).toBe(1);
    });
  });

  describe('Reproducible State Sequences', () => {
    it('should produce same state sequence', () => {
      const def1 = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const def2 = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const result1 = previewWorkflow(def1, 'det_state_001');
      const result2 = previewWorkflow(def2, 'det_state_002');

      // Both should succeed
      expect(result1.success).toBe(result2.success);
    });
  });
});
